// api/src/debtors/debtors.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DebtorsService } from './debtors.service';
import { CreateCustomerDto, CreateInvoiceDto, CreatePaymentDto } from './dto/debtors.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('debtors')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post('customer')
  createCustomer(@Body() createDto: CreateCustomerDto) {
    return this.debtorsService.createCustomer(createDto);
  }

  @Get('customers/:orgId')
  getCustomers(@Param('orgId') orgId: string) {
    return this.debtorsService.getCustomers(orgId);
  }

  @Post('invoice')
  issueInvoice(@Body() createDto: CreateInvoiceDto) {
    return this.debtorsService.issueInvoice(createDto);
  }

  @Post('payment')
  recordPayment(@Body() createDto: CreatePaymentDto) {
    return this.debtorsService.recordPayment(createDto);
  }
}