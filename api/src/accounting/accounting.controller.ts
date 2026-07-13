// api/src/accounting/accounting.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalDto } from './dto/accounting.dto';

// Strip down the route to eliminate collision with global 'api/v1' filters
@Controller('accounting') 
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('account')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(dto);
  }

  @Get('accounts/:organizationId')
  getAccounts(@Param('organizationId') organizationId: string) {
    return this.accountingService.getAccounts(organizationId);
  }

  @Post('journal')
  createJournal(@Body() dto: CreateJournalDto) {
    return this.accountingService.createJournal(dto);
  }

  @Get('ledger/:branchId')
  getLedger(@Param('branchId') branchId: string) {
    return this.accountingService.getLedger(branchId);
  }

  @Get('reports/:branchId')
  getReports(@Param('branchId') branchId: string) {
    return this.accountingService.getReports(branchId);
  }
}