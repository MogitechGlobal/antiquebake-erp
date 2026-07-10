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
  @IsString() @IsOptional() organizationId?: string; // Fixes the 400 Bad Request error
}

export class AdjustStockDto {
  @IsString() @IsNotEmpty() itemId!: string;
  @IsString() @IsNotEmpty() branchId!: string;
  @IsNumber() @Min(0) quantity!: number;
}