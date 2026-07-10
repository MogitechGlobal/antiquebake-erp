import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, AdjustStockDto, UpdateItemDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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
    // Safety check: Prevent deletion if item is used in active recipes
    const recipeLinks = await this.prisma.recipeIngredient.count({ where: { itemId: id } });
    if (recipeLinks > 0) throw new BadRequestException('Cannot delete: used in active production recipes.');

    // Safety check: Prevent deletion if item has historical sales
    const salesLinks = await this.prisma.salesItem.count({ where: { itemId: id } });
    if (salesLinks > 0) throw new BadRequestException('Cannot delete: linked to past sales transactions.');

    await this.prisma.inventory.deleteMany({ where: { itemId: id } });
    return this.prisma.item.delete({ where: { id } });
  }

  async adjustStock(dto: AdjustStockDto) {
    return this.prisma.inventory.upsert({
      where: { itemId_branchId: { itemId: dto.itemId, branchId: dto.branchId } },
      update: { quantity: dto.quantity },
      create: { itemId: dto.itemId, branchId: dto.branchId, quantity: dto.quantity },
    });
  }

  async getBranchStock(branchId: string) {
    return this.prisma.inventory.findMany({
      where: { branchId }, include: { item: true },
    });
  }
}