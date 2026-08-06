// api/src/production/production.service.ts
import { Injectable, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto, CreateProductionOrderDto, UpdateOrderStatusDto } from './dto/production.dto';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

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

  // --- REFACTORED STATUS UPDATE (ZERO-INVENTORY & FINANCIAL VALUATION) ---
  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto, userId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id }, 
      include: { 
        recipe: { 
          include: { 
            targetItem: true,
            ingredients: { include: { item: true } } 
          } 
        } 
      },
    });

    if (!order) throw new BadRequestException('Order not found');

    // If completing, deduct raw materials, add finished goods, and transfer valuation
    if (dto.status === 'COMPLETED' && order.status !== 'COMPLETED') {
      
      // 1. Pre-fetch Current Inventory Levels
      const ingredientItemIds = order.recipe.ingredients.map(ing => ing.itemId);
      const inventories = await this.prisma.inventory.findMany({
        where: { branchId: order.branchId, itemId: { in: ingredientItemIds } }
      });

      let totalProductionCost = 0;

      // 2. Enforce Zero-Inventory Policy & Calculate Total Cost
      for (const ing of order.recipe.ingredients) {
        const totalRequired = ing.quantity * order.targetQty;
        const stock = inventories.find(i => i.itemId === ing.itemId);

        // Strict stock validation
        if (!stock || stock.quantity < totalRequired) {
           throw new BadRequestException(
             `Production halted: Insufficient raw materials. Requires ${totalRequired} ${ing.item.unit} of ${ing.item.name}. Available: ${stock?.quantity || 0}`
           );
        }

        const unitCost = ing.item.cost || 0;
        totalProductionCost += (totalRequired * unitCost);
      }

      try {
        // 3. Execute Atomic Manufacturing Transaction
        return await this.prisma.$transaction(async (prisma) => {
          
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

          // Execute Financial Valuation Transfer
          await prisma.ledgerEntry.create({
            data: {
              date: new Date(),
              type: 'Asset Transfer',
              revenuePoint: 'Manufacturing Floor',
              paymentSource: 'Inventory Valuation',
              category: 'Cost of Goods Manufactured',
              description: `Produced ${order.targetQty} ${order.recipe.targetItem.name} (Order: ${order.orderNumber})`,
              amount: totalProductionCost,
              reference: order.orderNumber,
              branchId: order.branchId,
              createdById: userId
            }
          });
          
          await prisma.productionOrder.update({ where: { id }, data: { status: 'COMPLETED' } });
          
          return { message: 'Order completed, inventory updated, and costs logged.' };
        });
      } catch (error: any) {
        this.logger.error(`Production Finalization Failed: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Failed to process production order.');
      }
    }

    return this.prisma.productionOrder.update({ where: { id }, data: { status: dto.status } });
  }
}