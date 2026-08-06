// api/src/inventory/dto/inventory.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateItemDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() sku!: string;
  @IsString() @IsNotEmpty() category!: string;
  @IsString() @IsNotEmpty() unit!: string;
  @IsString() @IsNotEmpty() organizationId!: string;
  @IsNumber() @IsOptional() @Min(0) cost?: number;
  @IsNumber() @IsOptional() @Min(0) price?: number;
}

export class UpdateItemDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() sku?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() unit?: string;
  @IsNumber() @IsOptional() @Min(0) cost?: number;
  @IsNumber() @IsOptional() @Min(0) price?: number;
  @IsString() @IsOptional() organizationId?: string; 
}

export class AdjustStockDto {
  @IsString() @IsNotEmpty() itemId!: string;
  
  // Notice we accept 'storeId' to match the frontend, but map it to 'branchId' for the backend
  @IsString() @IsNotEmpty() storeId!: string; 
  
  @IsNumber() @Min(0) quantity!: number;

  @IsOptional() @IsString() targetStoreId?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() userId?: string | number;

  // Getter to seamlessly map storeId to branchId for Prisma
  get branchId(): string {
    return this.storeId;
  }
}