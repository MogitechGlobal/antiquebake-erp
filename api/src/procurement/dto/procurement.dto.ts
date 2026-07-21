// api/src/procurement/dto/procurement.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { IsIn, } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  organizationId!: string;
}

class POItemDto {
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

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  items!: POItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED']) // Make sure all these are allowed!
  status!: string;
}