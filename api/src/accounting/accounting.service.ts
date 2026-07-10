// api/src/accounting/accounting.service.ts
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, PostJournalDto } from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // --- CHART OF ACCOUNTS ---

  async createAccount(createDto: CreateAccountDto) {
    const existing = await this.prisma.account.findFirst({
      where: { code: createDto.code, organizationId: createDto.organizationId }
    });

    if (existing) {
      throw new ConflictException(`Account code ${createDto.code} already exists.`);
    }

    return this.prisma.account.create({ data: createDto });
  }

  async getAccounts(organizationId: string) {
    return this.prisma.account.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' }
    });
  }

  // --- GENERAL LEDGER ---

  async postJournal(postDto: PostJournalDto) {
    const { branchId, description, entries } = postDto;

    // Validate Double-Entry Accounting Rule
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
    });

    // Allowing a small floating point tolerance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Debits (${totalDebit}) must equal Credits (${totalCredit}).`);
    }

    if (totalDebit === 0 && totalCredit === 0) {
      throw new BadRequestException('Journal entry must have a non-zero value.');
    }

    const transactionId = `JRN-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const ledgerData = entries.map(entry => ({
      transactionId,
      branchId,
      accountId: entry.accountId,
      description,
      debit: entry.debit,
      credit: entry.credit,
    }));

    // Post all lines in a single transaction
    await this.prisma.ledgerEntry.createMany({
      data: ledgerData
    });

    return { message: 'Journal posted successfully', transactionId };
  }

  async getLedger(branchId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { branchId },
      include: { account: true },
      orderBy: { createdAt: 'desc' },
      take: 200 // Limit for performance on the UI
    });
  }

  // --- FINANCIAL REPORTS ---

  async getFinancialReport(branchId: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { branchId },
      include: { account: true }
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;

    // Normal Balance Rules:
    // Revenue, Liability, Equity increase with Credits.
    // Asset, Expense increase with Debits.
    entries.forEach(entry => {
      if (entry.account.type === 'REVENUE') {
         totalRevenue += (entry.credit - entry.debit);
      } else if (entry.account.type === 'EXPENSE') {
         totalExpense += (entry.debit - entry.credit);
      } else if (entry.account.type === 'ASSET') {
         totalAssets += (entry.debit - entry.credit);
      } else if (entry.account.type === 'LIABILITY') {
         totalLiabilities += (entry.credit - entry.debit);
      }
    });

    // Group expenses by account for the P&L breakdown
    const expenseBreakdown = entries
      .filter(e => e.account.type === 'EXPENSE')
      .reduce((acc, entry) => {
        const balance = entry.debit - entry.credit;
        if (!acc[entry.account.name]) {
          acc[entry.account.name] = 0;
        }
        acc[entry.account.name] += balance;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalExpense,
      totalAssets,
      totalLiabilities,
      netProfit: totalRevenue - totalExpense,
      expenseBreakdown: Object.entries(expenseBreakdown).map(([name, amount]) => ({ name, amount }))
    };
  }
}