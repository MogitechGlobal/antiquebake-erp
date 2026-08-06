// api/src/inventory/inventory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateItemDto, AdjustStockDto, UpdateItemDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- DATA FETCHING ROUTES ---

  @Get('stores')
  getStores() {
    return this.inventoryService.getStores();
  }

  @Get('items')
  getItems() {
    return this.inventoryService.getItems();
  }

  @Get('adjustments')
  getAdjustmentHistory() {
    return this.inventoryService.getAdjustmentHistory();
  }

  @Get('catalog/:orgId')
  getCatalog(@Param('orgId') orgId: string) { 
    return this.inventoryService.getCatalog(orgId); 
  }

  @Get('stock/:branchId')
  getBranchStock(@Param('branchId') branchId: string) { 
    return this.inventoryService.getBranchStock(branchId); 
  }

  // --- ACTION ROUTES ---

  @Post('item')
  createCatalogItem(@Body() dto: CreateItemDto) { 
    return this.inventoryService.createCatalogItem(dto); 
  }

  @Patch('item/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) { 
    return this.inventoryService.updateItem(id, dto); 
  }

  @Delete('item/:id')
  deleteItem(@Param('id') id: string) { 
    return this.inventoryService.deleteItem(id); 
  }

  // Changed from @Patch('stock') to @Post('adjustments') to match your frontend payload
  @Post('adjustments')
  @HttpCode(HttpStatus.OK)
  adjustStock(@Body() dto: AdjustStockDto) { 
    return this.inventoryService.adjustStock(dto); 
  }
}