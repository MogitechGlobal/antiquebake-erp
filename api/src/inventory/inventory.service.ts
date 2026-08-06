// api/src/inventory/inventory.service.ts
import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, AdjustStockDto, UpdateItemDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // --- CATALOG METHODS ---

  async createCatalogItem(dto: CreateItemDto) {
    const existing = await this.prisma.item.findUnique({
      where: { sku_organizationId: { sku: dto.sku, organizationId: dto.organizationId } },
    });
    if (existing) throw new ConflictException('Item with this SKU already exists.');
    return this.prisma.item.create({ data: dto });
  }

  async getCatalog(organizationId: string) {
    return this.prisma.item.findMany({
      where: { organizationId },
      include: { ingredientIn: { include: { recipe: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async deleteItem(id: string) {
    const recipeLinks = await this.prisma.recipeIngredient.count({ where: { itemId: id } });
    if (recipeLinks > 0) throw new BadRequestException('Cannot delete: used in active production recipes.');

    const salesLinks = await this.prisma.salesItem.count({ where: { itemId: id } });
    if (salesLinks > 0) throw new BadRequestException('Cannot delete: linked to past sales transactions.');

    await this.prisma.inventory.deleteMany({ where: { itemId: id } });
    return this.prisma.item.delete({ where: { id } });
  }

  // --- DATA FETCHING FOR ADJUSTMENTS ---

  async getStores() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getItems() {
    return this.prisma.item.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getAdjustmentHistory() {
    return this.prisma.inventoryAdjustment.findMany({
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        item: true,
        sourceStore: true,
        targetStore: true,
      }
    });
  }

  async getBranchStock(branchId: string) {
    return this.prisma.inventory.findMany({
      where: { branchId }, include: { item: true },
    });
  }

  // --- UNIFIED ADJUST STOCK METHOD ---

  async adjustStock(dto: AdjustStockDto) {
    const { itemId, branchId, quantity } = dto;
    const type = (dto as any).type || "Correction"; 
    const targetStoreId = (dto as any).targetStoreId;
    const notes = (dto as any).notes;
    // Fallback safely to undefined if userId is a mock '1' from frontend testing
    const userId = (dto as any).userId === "1" ? undefined : String((dto as any).userId);

    if (quantity <= 0) {
      throw new BadRequestException("Quantity must be greater than 0");
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // --- HANDLE TRANSFER ---
        if (type === "Transfer") {
          if (!targetStoreId) throw new BadRequestException("Target store is required for transfers.");
          if (branchId === targetStoreId) throw new BadRequestException("Cannot transfer to the same store.");

          // 1. Subtract from Source Store
          await tx.inventory.updateMany({
            where: { itemId, branchId },
            data: { quantity: { decrement: quantity } },
          });

          // 2. Add to Target Store
          await tx.inventory.upsert({
            where: { itemId_branchId: { itemId, branchId: targetStoreId } },
            update: { quantity: { increment: quantity } },
            create: { itemId, branchId: targetStoreId, quantity },
          });

          // 3. Log the Transfer safely with correct String typing
          await tx.inventoryAdjustment.create({
            data: {
              itemId, 
              storeId: branchId, 
              transferToStoreId: targetStoreId,
              userId, 
              type, 
              quantity, 
              notes
            },
          });
        } 
        // --- HANDLE NORMAL ADJUSTMENT ---
        else {
          const isAddition = ["Restock", "Correction"].includes(type);
          
          await tx.inventory.upsert({
            where: { itemId_branchId: { itemId, branchId } },
            update: {
              quantity: isAddition ? { increment: quantity } : { decrement: quantity }
            },
            create: {
              itemId, branchId,
              quantity: isAddition ? quantity : -quantity,
            },
          });

          // Log the Adjustment safely with correct String typing
          await tx.inventoryAdjustment.create({
            data: {
              itemId, 
              storeId: branchId, 
              userId, 
              type, 
              quantity, 
              notes
            },
          });
        }
      });

      return { message: "Stock adjusted successfully!" };

    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error instanceof Error ? error.message : "Transaction failed");
    }
  }
}