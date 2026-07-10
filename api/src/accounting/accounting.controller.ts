// api/src/accounting/accounting.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, PostJournalDto } from './dto/accounting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('account')
  createAccount(@Body() createDto: CreateAccountDto) {
    return this.accountingService.createAccount(createDto);
  }

  @Get('accounts/:orgId')
  getAccounts(@Param('orgId') orgId: string) {
    return this.accountingService.getAccounts(orgId);
  }

  @Post('journal')
  postJournal(@Body() postDto: PostJournalDto) {
    return this.accountingService.postJournal(postDto);
  }

  @Get('ledger/:branchId')
  getLedger(@Param('branchId') branchId: string) {
    return this.accountingService.getLedger(branchId);
  }

  @Get('reports/:branchId')
  getFinancialReport(@Param('branchId') branchId: string) {
    return this.accountingService.getFinancialReport(branchId);
  }
}