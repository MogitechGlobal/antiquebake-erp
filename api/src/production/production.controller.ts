import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateRecipeDto, UpdateRecipeDto, CreateProductionOrderDto, UpdateOrderStatusDto } from './dto/production.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('recipe')
  createRecipe(@Body() dto: CreateRecipeDto) { return this.productionService.createRecipe(dto); }

  @Get('recipes/:orgId')
  getRecipes(@Param('orgId') orgId: string) { return this.productionService.getRecipes(orgId); }

  @Patch('recipe/:id')
  updateRecipe(@Param('id') id: string, @Body() dto: UpdateRecipeDto) { return this.productionService.updateRecipe(id, dto); }

  @Delete('recipe/:id')
  deleteRecipe(@Param('id') id: string) { return this.productionService.deleteRecipe(id); }

  @Post('order')
  createOrder(@Body() dto: CreateProductionOrderDto) { return this.productionService.createOrder(dto); }

  @Get('orders/:branchId')
  getOrders(@Param('branchId') branchId: string) { return this.productionService.getOrders(branchId); }

  @Patch('order/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return this.productionService.updateOrderStatus(id, dto); }
}