// api/src/accounting/accounting.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  
  constructor(private prisma: PrismaService) {}

  private async getFullUser(reqUser: any) {
    // Log the incoming object to see its exact structure
    this.logger.debug('Incoming reqUser object:', JSON.stringify(reqUser));

    if (!reqUser) {
        throw new UnauthorizedException('No user object found in request.');
    }

    // Handle common nested payload structures
    const payload = reqUser.user ? reqUser.user : reqUser;

    // Extract the ID safely (checking common JWT standard keys)
    const userId = payload.id || payload.sub || payload.userId;

    if (!userId) {
      this.logger.error('Failed to find ID in payload:', JSON.stringify(payload));
      throw new UnauthorizedException('Invalid JWT payload: Missing user ID.');
    }

    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { staff: true } // Let's eagerly load the staff profile while we are here
    });

    if (!user) {
      throw new UnauthorizedException('Active user profile not found in database.');
    }

    return user;
  }

  async createLegacyEntry(data: any, reqUser: any) {
    const user = await this.getFullUser(reqUser);
    
    return this.prisma.ledgerEntry.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        revenuePoint: data.revenue_point,
        paymentSource: data.payment_source,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        reference: data.reference || '',
        receiptPath: data.receipt_path || null,
        branchId: user.branchId,
        createdById: user.id
      }
    });
  }

  async getLegacyLedger(query: any, reqUser: any) {
    const user = await this.getFullUser(reqUser);
    const { period, dept, staff, start, end } = query;
    const branchId = user.branchId;

    // 1. Replicate PHP Date Logic
    let startDate = new Date();
    let endDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const now = new Date();
    
    if (period === 'yesterday') {
       startDate.setDate(startDate.getDate() - 1);
       endDate.setDate(endDate.getDate() - 1);
    } else if (period === 'this_week') {
       const day = now.getDay();
       const diff = now.getDate() - day + (day === 0 ? -6 : 1);
       startDate.setDate(diff);
    } else if (period === 'this_month') {
       startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_month') {
       startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
       endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'this_year') {
       startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'custom') {
       startDate = new Date(start); startDate.setHours(0,0,0,0);
       endDate = new Date(end); endDate.setHours(23,59,59,999);
    }

    // 2. Build Query Filters
    const where: any = {
       branchId,
       date: { gte: startDate, lte: endDate }
    };
    if (dept) where.revenuePoint = dept;
    if (staff) where.createdById = staff;

    // 3. Fetch Data
    const transactions = await this.prisma.ledgerEntry.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: { createdBy: { include: { staff: true } } }
    });

    // Format to match exact UI payload
    const formattedTx = transactions.map(t => ({
      id: t.id,
      date: t.date,
      type: t.type,
      revenue_point: t.revenuePoint,
      payment_source: t.paymentSource,
      category: t.category,
      description: t.description,
      amount: t.amount,
      reference: t.reference,
      receipt_path: t.receiptPath,
      staff_name: t.createdBy?.staff ? `${t.createdBy.staff.firstName} ${t.createdBy.staff.lastName}` : 'System',
      created_by: t.createdById
    }));

    // 4. Calculate Opening Balance (All matching records prior to startDate)
    const openWhere: any = { branchId, date: { lt: startDate } };
    if (dept) openWhere.revenuePoint = dept;
    if (staff) openWhere.createdById = staff;
    
    const priorTx = await this.prisma.ledgerEntry.findMany({ where: openWhere });
    const openingBalance = priorTx.reduce((sum, t) => sum + (t.type === 'Income' ? t.amount : -t.amount), 0);

    // 5. Fetch Support Data
    const staffUsers = await this.prisma.user.findMany({ where: { branchId }, include: { staff: true } });
    const staffList = staffUsers.map(u => ({ id: u.id, username: `${u.staff.firstName} ${u.staff.lastName}` }));
    const expenseAccounts = ["Salaries", "Utilities", "Maintenance", "Supplies", "Marketing", "Taxes", "Transport", "Miscellaneous"];

    return {
      transactions: formattedTx,
      opening_balance: openingBalance,
      staff_list: staffList,
      expense_accounts: expenseAccounts
    };
  }

  async updateLegacyEntry(id: string, data: any) {
    return this.prisma.ledgerEntry.update({
      where: { id },
      data: {
        date: new Date(data.date),
        type: data.type,
        revenuePoint: data.revenue_point,
        paymentSource: data.payment_source,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        reference: data.reference || '',
        receiptPath: data.receipt_path || null,
      }
    });
  }

  async deleteLegacyEntry(id: string) {
    return this.prisma.ledgerEntry.delete({ where: { id } });
  }

  async syncSystem() {
    // Placeholder for future POS sync logic
    return { message: "System synced successfully" };
  }
}