// api/src/pos/pos.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/pos.dto';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async processCheckout(createDto: CreateTransactionDto) {
    const { branchId, staffId, paymentMethod, items } = createDto;
    
    // Generate a secure receipt string
    const receiptNumber = `RCPT-${Math.floor(1000000 + Math.random() * 9000000)}`;

    // Calculate totals securely on the backend to prevent client-side spoofing
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal
      };
    });

    if (totalAmount <= 0) {
      throw new BadRequestException('Transaction total must be greater than zero.');
    }

    // Execute the financial and inventory shifts atomically
    return this.prisma.$transaction(async (prisma) => {
      // 1. Log the financial transaction
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

      // 2. Deduct the sold items from the branch's inventory
      for (const item of processedItems) {
        // We use update rather than upsert because an item must exist in inventory to be sold
        await prisma.inventory.update({
          where: { 
            itemId_branchId: { itemId: item.itemId, branchId } 
          },
          data: { 
            quantity: { decrement: item.quantity } 
          }
        });
      }

      return transaction;
    });
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
    return this.prisma.salesTransaction.findMany({
      where: { branchId },
      include: {
        staff: { include: { staff: true } },
        items: { include: { item: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTransactionStatus(id: string, status: string) {
    const transaction = await this.prisma.salesTransaction.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!transaction) throw new BadRequestException('Transaction not found');

    // If voiding, revert inventory stock
    if (status === 'CANCELLED' && transaction.status !== 'CANCELLED') {
      await this.prisma.$transaction(async (prisma) => {
        // Revert stock for each item sold
        for (const item of transaction.items) {
          // Check if inventory record exists before attempting to update
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
               data: { quantity: { increment: item.quantity } }
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
    }

    // Standard update for any other status changes
    return this.prisma.salesTransaction.update({
      where: { id },
      data: { status }
    });
  }
}