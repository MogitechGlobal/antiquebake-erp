// api/src/pos/dto/pos.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class SalesItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @IsEnum(['CASH', 'CARD', 'MOBILE', 'BANK', 'TIGO'])
  paymentMethod!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesItemDto)
  items!: SalesItemDto[];
}

export class UpdateTransactionStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}