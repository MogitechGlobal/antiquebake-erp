// api/src/debtors/debtors.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, CreateInvoiceDto, CreatePaymentDto } from './dto/debtors.dto';

@Injectable()
export class DebtorsService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(createDto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: createDto });
  }

  async getCustomers(organizationId: string) {
    // Fetch customers along with their financial history
    return this.prisma.customer.findMany({
      where: { organizationId },
      include: {
        invoices: true,
        payments: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async issueInvoice(createDto: CreateInvoiceDto) {
    const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    
    return this.prisma.invoice.create({
      data: {
        invoiceNum,
        amount: createDto.amount,
        balance: createDto.amount,
        customerId: createDto.customerId,
        branchId: createDto.branchId,
      }
    });
  }

  async recordPayment(createDto: CreatePaymentDto) {
    const receiptNum = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Log the payment
      const payment = await prisma.payment.create({
        data: {
          receiptNum,
          amount: createDto.amount,
          method: createDto.method,
          customerId: createDto.customerId,
          branchId: createDto.branchId,
        }
      });

      // 2. Fetch all unpaid or partially paid invoices for this customer, oldest first
      const openInvoices = await prisma.invoice.findMany({
        where: { 
          customerId: createDto.customerId, 
          status: { not: 'PAID' } 
        },
        orderBy: { createdAt: 'asc' }
      });

      let remainingPayment = createDto.amount;

      // 3. Waterfall: Apply the payment to invoices until the payment is exhausted
      for (const invoice of openInvoices) {
        if (remainingPayment <= 0) break;

        const amountToApply = Math.min(invoice.balance, remainingPayment);
        remainingPayment -= amountToApply;
        
        const newBalance = invoice.balance - amountToApply;
        const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { balance: newBalance, status: newStatus }
        });
      }

      return payment;
    });
  }
}