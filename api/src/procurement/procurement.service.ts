// api/src/procurement/procurement.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, CreatePurchaseOrderDto, UpdatePOStatusDto } from './dto/procurement.dto';

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

  async updatePOStatus(id: string, updateDto: UpdatePOStatusDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status === 'RECEIVED') throw new BadRequestException('Order is already received and processed.');

    if (updateDto.status !== 'RECEIVED') {
      return this.prisma.purchaseOrder.update({
        where: { id },
        data: { status: updateDto.status },
      });
    }

    // --- GRN (Goods Receipt Note) TRANSACTION ---
    return this.prisma.$transaction(async (prisma) => {
      const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });

      // Increment inventory for each received item
      for (const poItem of po.items) {
        await prisma.inventory.upsert({
          where: { itemId_branchId: { itemId: poItem.itemId, branchId: po.branchId } },
          update: { quantity: { increment: poItem.quantity } },
          create: { itemId: poItem.itemId, branchId: po.branchId, quantity: poItem.quantity },
        });
      }

      return updatedPO;
    });
  }
}