// api/src/pos/pos.service.ts
import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/pos.dto';

@Injectable()
export class PosService {
  // Initialize the logger to capture backend crashes
  private readonly logger = new Logger(PosService.name);

  constructor(private prisma: PrismaService) {}

  async processCheckout(createDto: CreateTransactionDto) {
    const { branchId, staffId, paymentMethod, items } = createDto;
    
    try {
      // 1. Fetch Authoritative Pricing from the Database
      const itemIds = items.map(i => i.itemId);
      const catalogItems = await this.prisma.item.findMany({
        where: { id: { in: itemIds } }
      });

      if (catalogItems.length !== itemIds.length) {
        throw new BadRequestException('One or more items in the cart are invalid or unrecognized.');
      }

      // 2. Fetch Current Inventory Levels
      const inventories = await this.prisma.inventory.findMany({
        where: {
          branchId: branchId,
          itemId: { in: itemIds }
        }
      });

      const receiptNumber = `RCPT-${Math.floor(1000000 + Math.random() * 9000000)}`;
      let totalAmount = 0;

      // 3. Validate Stock (Zero-Inventory Policy) and Calculate Totals Securely
      const processedItems = items.map(cartItem => {
        const catalogItem = catalogItems.find(i => i.id === cartItem.itemId);
        const stock = inventories.find(i => i.itemId === cartItem.itemId);

        if (!catalogItem) {
          throw new BadRequestException(`Catalog item missing for ID: ${cartItem.itemId}`);
        }

        // Force numeric conversion to prevent Prisma decrement string errors
        const requestedQty = Number(cartItem.quantity);

        // Enforce zero-inventory policy
        if (!stock || stock.quantity < requestedQty) {
          throw new BadRequestException(
            `Transaction rejected: Insufficient stock for ${catalogItem.name}. Available: ${stock?.quantity || 0}`
          );
        }

        // Override client price with authoritative backend price (forced to Number)
        const unitPrice = Number(catalogItem.price);
        const subtotal = requestedQty * unitPrice;
        totalAmount += subtotal;

        return {
          itemId: cartItem.itemId,
          quantity: requestedQty,
          unitPrice: unitPrice, 
          subtotal: subtotal
        };
      });

      if (totalAmount <= 0) {
        throw new BadRequestException('Transaction total must be greater than zero.');
      }

      // 4. Execute the financial and inventory shifts atomically
      // Await is crucial here inside the try block to catch Prisma transaction failures
      return await this.prisma.$transaction(async (prisma) => {
        // A. Log the financial POS transaction
        const transaction = await prisma.salesTransaction.create({
          data: {
            receiptNumber,
            branchId,
            staffId,
            totalAmount,
            paymentMethod,
            items: {
              create: processedItems
            }
          },
          include: { items: true }
        });

        // B. Deduct the sold items from the branch's inventory
        for (const item of processedItems) {
          await prisma.inventory.update({
            where: { 
              itemId_branchId: { itemId: item.itemId, branchId } 
            },
            data: { 
              quantity: { decrement: item.quantity } 
            }
          });
        }

        // C. Automatically Post to General Ledger
        await prisma.ledgerEntry.create({
          data: {
            date: new Date(),
            type: 'Income',
            revenuePoint: 'POS',
            paymentSource: paymentMethod,
            category: 'Sales Revenue',
            description: `POS Sale - Receipt ${receiptNumber}`,
            amount: totalAmount,
            reference: receiptNumber,
            branchId,
            createdById: staffId
          }
        });

        return transaction;
      });

    } catch (error: any) {
      // 5. Catch and Log Database Exceptions
      this.logger.error(`Checkout Failed: ${error.message}`, error.stack);
      
      // Pass safe validation errors back to the frontend
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Mask database structure errors from the frontend to prevent data leakage
      throw new InternalServerErrorException('Transaction failed to process. Check server logs.');
    }
  }

  async getBranchTransactions(branchId: string) {
    return this.prisma.salesTransaction.findMany({
      where: { branchId },
      include: {
        staff: { include: { staff: true } },
        items: { include: { item: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTransactions(branchId: string) {
    return this.getBranchTransactions(branchId);
  }

  async updateTransactionStatus(id: string, status: string) {
    const transaction = await this.prisma.salesTransaction.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!transaction) throw new BadRequestException('Transaction not found');

    // If voiding, revert inventory stock
    if (status === 'CANCELLED' && transaction.status !== 'CANCELLED') {
      try {
        await this.prisma.$transaction(async (prisma) => {
          // Revert stock for each item sold
          for (const item of transaction.items) {
            const inventoryRecord = await prisma.inventory.findUnique({
              where: {
                itemId_branchId: {
                  itemId: item.itemId,
                  branchId: transaction.branchId
                }
              }
            });

            if (inventoryRecord) {
               await prisma.inventory.update({
                 where: { itemId_branchId: { itemId: item.itemId, branchId: transaction.branchId } },
                 data: { quantity: { increment: Number(item.quantity) } }
               });
            }
          }
          
          // Update transaction status
          await prisma.salesTransaction.update({
            where: { id },
            data: { status }
          });
        });
        return { message: 'Transaction voided and inventory reverted successfully.' };
      } catch (error: any) {
         this.logger.error(`Void Transaction Failed: ${error.message}`, error.stack);
         throw new InternalServerErrorException('Failed to void transaction and revert inventory.');
      }
    }

    // Standard update for any other status changes
    return this.prisma.salesTransaction.update({
      where: { id },
      data: { status }
    });
  }
}