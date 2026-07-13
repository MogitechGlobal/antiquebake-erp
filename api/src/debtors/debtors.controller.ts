import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { DebtorsService } from './debtors.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateInvoiceDto, RecordPaymentDto } from './dto/debtors.dto';

@Controller('debtors') // Changed from 'api/v1/debtors' to just 'debtors'
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post('customer')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.debtorsService.createCustomer(dto);
  }

  @Get('customers/:organizationId')
  getCustomers(@Param('organizationId') organizationId: string) {
    return this.debtorsService.getCustomers(organizationId);
  }

  @Patch('customer/:id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.debtorsService.updateCustomer(id, dto);
  }

  @Delete('customer/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.debtorsService.deleteCustomer(id);
  }

  @Post('invoice')
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.debtorsService.createInvoice(dto);
  }

  @Delete('invoice/:id')
  deleteInvoice(@Param('id') id: string) {
    return this.debtorsService.deleteInvoice(id);
  }

  @Post('payment')
  recordPayment(@Body() dto: RecordPaymentDto) {
    return this.debtorsService.recordPayment(dto);
  }

  @Delete('payment/:id')
  deletePayment(@Param('id') id: string) {
    return this.debtorsService.deletePayment(id);
  }
}