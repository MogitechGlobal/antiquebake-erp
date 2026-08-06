// api/src/procurement/procurement.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, CreatePurchaseOrderDto, UpdateOrderStatusDto } from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  // --- SUPPLIERS ---

  async createSupplier(createDto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: createDto,
    });
  }

  async getSuppliers(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  // --- PURCHASE ORDERS ---

  async createPurchaseOrder(createDto: CreatePurchaseOrderDto) {
    const { supplierId, branchId, items } = createDto;
    const poNumber = `LPO-${Math.floor(100000 + Math.random() * 900000)}`;

    let totalAmount = 0;
    const poItems = items.map(item => {
      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        branchId,
        totalAmount,
        items: {
          create: poItems,
        },
      },
      include: { supplier: true, items: { include: { item: true } } },
    });
  }

  async getBranchPurchaseOrders(branchId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { branchId },
      include: { supplier: true, items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- REFACTORED STATUS UPDATE (WITH ACCOUNTS PAYABLE & COSTING) ---
  
  async updatePOStatus(id: string, updateDto: UpdateOrderStatusDto, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { 
        supplier: true, 
        items: { include: { item: true } } 
      },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status === 'RECEIVED') throw new BadRequestException('Order is already received and processed.');

    if (updateDto.status !== 'RECEIVED') {
      return this.prisma.purchaseOrder.update({
        where: { id },
        data: { status: updateDto.status },
      });
    }

    // --- GRN, COSTING & ACCOUNTS PAYABLE TRANSACTION ---
    return this.prisma.$transaction(async (prisma) => {
      const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });

      for (const poItem of po.items) {
        // 1. Increment Inventory
        await prisma.inventory.upsert({
          where: { itemId_branchId: { itemId: poItem.itemId, branchId: po.branchId } },
          update: { quantity: { increment: poItem.quantity } },
          create: { itemId: poItem.itemId, branchId: po.branchId, quantity: poItem.quantity },
        });

        // 2. Calculate Moving Average Cost
        const globalStock = await prisma.inventory.aggregate({
          where: { itemId: poItem.itemId },
          _sum: { quantity: true }
        });
        
        const currentTotalQty = globalStock._sum.quantity || 0;
        const currentCost = poItem.item.cost || 0;

        const oldTotalValue = currentTotalQty * currentCost;
        const newTotalValue = poItem.quantity * poItem.unitPrice;
        const newAverageCost = (oldTotalValue + newTotalValue) / (currentTotalQty + poItem.quantity);

        // 3. Update Item Cost
        await prisma.item.update({
          where: { id: poItem.itemId },
          data: { cost: newAverageCost }
        });
      }

      // 4. Create Liability Record
      await prisma.ledgerEntry.create({
        data: {
          date: new Date(),
          type: 'Expense',
          revenuePoint: 'Procurement',
          paymentSource: 'Accounts Payable',
          category: 'Supplier Credit',
          description: `Goods Received - PO ${po.poNumber} from ${po.supplier.name}`,
          amount: po.totalAmount,
          reference: po.poNumber,
          branchId: po.branchId,
          createdById: userId 
        }
      });

      return updatedPO;
    });
  }
}