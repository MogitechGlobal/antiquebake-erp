import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto, CreateProductionOrderDto, UpdateOrderStatusDto } from './dto/production.dto';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  // --- RECIPES ---
  async createRecipe(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({
      data: {
        name: dto.name,
        organizationId: dto.organizationId,
        targetItemId: dto.targetItemId,
        ingredients: { create: dto.ingredients },
      },
    });
  }

  async updateRecipe(id: string, dto: UpdateRecipeDto) {
    // Delete existing ingredients, then recreate them
    await this.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    return this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name,
        targetItemId: dto.targetItemId,
        ingredients: dto.ingredients ? { create: dto.ingredients } : undefined,
      },
    });
  }

  async getRecipes(organizationId: string) {
    return this.prisma.recipe.findMany({
      where: { organizationId },
      include: { targetItem: true, ingredients: { include: { item: true } } },
    });
  }

  async deleteRecipe(id: string) {
    const orderCount = await this.prisma.productionOrder.count({ where: { recipeId: id } });
    if (orderCount > 0) throw new BadRequestException('Cannot delete recipe linked to production orders.');
    return this.prisma.recipe.delete({ where: { id } });
  }

  // --- PRODUCTION ORDERS ---
  async createOrder(dto: CreateProductionOrderDto) {
    const orderNumber = `PRD-${Math.floor(100000 + Math.random() * 900000)}`;
    return this.prisma.productionOrder.create({
      data: { orderNumber, recipeId: dto.recipeId, branchId: dto.branchId, targetQty: dto.targetQty },
    });
  }

  async getOrders(branchId: string) {
    return this.prisma.productionOrder.findMany({
      where: { branchId },
      include: { recipe: { include: { targetItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id }, include: { recipe: { include: { ingredients: true } } },
    });

    if (!order) throw new BadRequestException('Order not found');

    // If completing, deduct raw materials and add finished goods
    if (dto.status === 'COMPLETED' && order.status !== 'COMPLETED') {
      await this.prisma.$transaction(async (prisma) => {
        // Deduct ingredients
        for (const ing of order.recipe.ingredients) {
          const totalRequired = ing.quantity * order.targetQty;
          await prisma.inventory.update({
            where: { itemId_branchId: { itemId: ing.itemId, branchId: order.branchId } },
            data: { quantity: { decrement: totalRequired } },
          });
        }
        // Add Finished Good
        await prisma.inventory.upsert({
          where: { itemId_branchId: { itemId: order.recipe.targetItemId, branchId: order.branchId } },
          update: { quantity: { increment: order.targetQty } },
          create: { itemId: order.recipe.targetItemId, branchId: order.branchId, quantity: order.targetQty },
        });
        
        await prisma.productionOrder.update({ where: { id }, data: { status: 'COMPLETED' } });
      });
      return { message: 'Order completed and inventory updated.' };
    }

    return this.prisma.productionOrder.update({ where: { id }, data: { status: dto.status } });
  }
}