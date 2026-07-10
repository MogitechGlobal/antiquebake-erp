// api/src/procurement/procurement.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreateSupplierDto, CreatePurchaseOrderDto, UpdatePOStatusDto } from './dto/procurement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('supplier')
  createSupplier(@Body() createDto: CreateSupplierDto) {
    return this.procurementService.createSupplier(createDto);
  }

  @Get('suppliers/:orgId')
  getSuppliers(@Param('orgId') orgId: string) {
    return this.procurementService.getSuppliers(orgId);
  }

  @Post('order')
  createPurchaseOrder(@Body() createDto: CreatePurchaseOrderDto) {
    return this.procurementService.createPurchaseOrder(createDto);
  }

  @Get('orders/:branchId')
  getBranchPurchaseOrders(@Param('branchId') branchId: string) {
    return this.procurementService.getBranchPurchaseOrders(branchId);
  }

  @Patch('order/:id/status')
  updatePOStatus(@Param('id') id: string, @Body() updateDto: UpdatePOStatusDto) {
    return this.procurementService.updatePOStatus(id, updateDto);
  }
}