// api/src/debtors/debtors.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateInvoiceDto, RecordPaymentDto } from './dto/debtors.dto';

@Injectable()
export class DebtorsService {
  constructor(private prisma: PrismaService) {}

  async getCustomers(organizationId: string) {
    return this.prisma.customer.findMany({
      where: { organizationId },
      include: { 
        invoices: { orderBy: { createdAt: 'desc' } }, 
        payments: { orderBy: { createdAt: 'desc' } } 
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCustomer(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async deleteCustomer(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const totalAmount = dto.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    if (totalAmount <= 0) throw new BadRequestException("Invoice amount must be greater than zero.");

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    
    // Execute as an Atomic Transaction: Create Invoice AND Deduct Stock simultaneously
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the official invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNum,
          amount: totalAmount,
          balance: totalAmount,
          status: 'UNPAID',
          customerId: dto.customerId,
          branchId: dto.branchId,
        }
      });

      // 2. Loop through billed items and deduct from Branch Inventory
      for (const item of dto.items) {
        const inventoryRecord = await prisma.inventory.findUnique({
          where: {
            itemId_branchId: {
              itemId: item.itemId,
              branchId: dto.branchId
            }
          }
        });

        if (inventoryRecord) {
          // Deduct from existing stock
          await prisma.inventory.update({
            where: { id: inventoryRecord.id },
            data: { quantity: { decrement: item.quantity } }
          });
        } else {
          // Ghost Shield: If item was never officially stocked but is being billed, 
          // create a negative stock entry to maintain strict mathematical tracking.
          await prisma.inventory.create({
            data: {
              itemId: item.itemId,
              branchId: dto.branchId,
              quantity: -item.quantity 
            }
          });
        }
      }

      return invoice;
    });
  }

  async deleteInvoice(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  async recordPayment(dto: RecordPaymentDto) {
    const invoices = await this.prisma.invoice.findMany({
      where: { customerId: dto.customerId, balance: { gt: 0 } },
      orderBy: { createdAt: 'asc' } 
    });

    let remainingPayment = dto.amount;

    for (const inv of invoices) {
      if (remainingPayment <= 0) break;
      const amountToApply = Math.min(inv.balance, remainingPayment);
      remainingPayment -= amountToApply;
      const newBalance = inv.balance - amountToApply;
      
      await this.prisma.invoice.update({
        where: { id: inv.id },
        data: { balance: newBalance, status: newBalance <= 0 ? 'PAID' : 'PARTIAL' }
      });
    }

    const receiptNum = `RCPT-${Date.now().toString().slice(-6)}`;
    return this.prisma.payment.create({
      data: {
        receiptNum,
        amount: dto.amount,
        method: dto.method,
        customerId: dto.customerId,
        branchId: dto.branchId,
      }
    });
  }

  async deletePayment(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }
}