import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path if needed

@UseGuards(JwtAuthGuard)
@Controller('accounting') // Remember: no 'api/v1' here due to your global prefix
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('ledger/legacy-format')
  createLegacyEntry(@Body() data: any, @Request() req: any) { // <-- Add ": any" here
    return this.accountingService.createLegacyEntry(data, req.user);
  }

  @Get('ledger/legacy-format')
  getLegacyLedger(@Query() query: any, @Request() req: any) { // <-- Add ": any" here
    return this.accountingService.getLegacyLedger(query, req.user);
  }

  @Patch('ledger/legacy-format/:id')
  updateLegacyEntry(@Param('id') id: string, @Body() data: any) {
    return this.accountingService.updateLegacyEntry(id, data);
  }

  @Delete('ledger/legacy-format/:id')
  deleteLegacyEntry(@Param('id') id: string) {
    return this.accountingService.deleteLegacyEntry(id);
  }

  @Post('sync')
  syncSystem() {
    return this.accountingService.syncSystem();
  }
}