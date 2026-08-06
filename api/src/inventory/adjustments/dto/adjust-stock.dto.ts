// api/src/inventory/adjustments/dto/adjust-stock.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  itemId!: number;

  @IsInt()
  storeId!: number;

  @IsOptional()
  @IsInt()
  targetStoreId?: number;

  @IsString()
  type!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  userId!: number;
}