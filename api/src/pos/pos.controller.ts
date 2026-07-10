// api/src/pos/pos.controller.ts
import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { UpdateTransactionStatusDto } from './dto/pos.dto';
import { CreateTransactionDto } from './dto/pos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('checkout')
  processCheckout(@Body() createDto: CreateTransactionDto) {
    return this.posService.processCheckout(createDto);
  }

  @Get('transactions/:branchId')
  getBranchTransactions(@Param('branchId') branchId: string) {
    return this.posService.getBranchTransactions(branchId);
  }

  @Patch('transaction/:id/status')
  updateTransactionStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateTransactionStatusDto
  ) {
    return this.posService.updateTransactionStatus(id, dto.status);
  }
}