import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalDto, CreateAccountDto } from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async createAccount(dto: CreateAccountDto) {
    return this.prisma.account.create({ data: dto });
  }

  async getAccounts(organizationId: string) {
    return this.prisma.account.findMany({
      where: { organizationId },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
  }

  async createJournal(dto: CreateJournalDto) {
    // Validate Double-Entry Math
    const totalDebit = dto.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = dto.entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Debits and credits must balance exactly.');
    }

    const transactionId = `JRN-${Date.now()}`;
    const dateObj = dto.entryDate ? new Date(dto.entryDate) : new Date();

    // Perform transactional insert so all lines succeed or fail together
    return this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.ledgerEntry.create({
          data: {
            transactionId,
            branchId: dto.branchId,
            accountId: entry.accountId,
            description: dto.description,
            debit: entry.debit,
            credit: entry.credit,
            entryDate: dateObj,
          },
        })
      )
    );
  }

  async getLedger(branchId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { branchId },
      include: { account: true },
      orderBy: { entryDate: 'desc' },
    });
  }

  async getReports(branchId: string) {
    const ledger = await this.prisma.ledgerEntry.findMany({
      where: { branchId },
      include: { account: true },
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    const expenseMap = new Map<string, number>();

    ledger.forEach((entry) => {
      const accType = entry.account.type.toUpperCase();
      const netCredit = entry.credit - entry.debit; 
      const netDebit = entry.debit - entry.credit;

      if (accType === 'REVENUE') totalRevenue += netCredit;
      if (accType === 'LIABILITY') totalLiabilities += netCredit;
      
      if (accType === 'EXPENSE') {
        totalExpense += netDebit;
        expenseMap.set(
          entry.account.name, 
          (expenseMap.get(entry.account.name) || 0) + netDebit
        );
      }
      if (accType === 'ASSET') totalAssets += netDebit;
    });

    return {
      totalRevenue,
      totalExpense,
      totalAssets,
      totalLiabilities,
      netProfit: totalRevenue - totalExpense,
      expenseBreakdown: Array.from(expenseMap.entries()).map(([name, amount]) => ({ name, amount })),
    };
  }
}