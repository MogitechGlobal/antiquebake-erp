import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateItemDto, AdjustStockDto, UpdateItemDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('item')
  createCatalogItem(@Body() dto: CreateItemDto) { return this.inventoryService.createCatalogItem(dto); }

  @Get('catalog/:orgId')
  getCatalog(@Param('orgId') orgId: string) { return this.inventoryService.getCatalog(orgId); }

  @Patch('item/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) { return this.inventoryService.updateItem(id, dto); }

  @Delete('item/:id')
  deleteItem(@Param('id') id: string) { return this.inventoryService.deleteItem(id); }

  @Patch('stock')
  adjustStock(@Body() dto: AdjustStockDto) { return this.inventoryService.adjustStock(dto); }

  @Get('stock/:branchId')
  getBranchStock(@Param('branchId') branchId: string) { return this.inventoryService.getBranchStock(branchId); }
}