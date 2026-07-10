import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class RecipeIngredientDto {
  @IsString() @IsNotEmpty() itemId!: string;
  @IsNumber() @Min(0.01) quantity!: number;
}

export class CreateRecipeDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() targetItemId!: string;
  @IsString() @IsNotEmpty() organizationId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => RecipeIngredientDto) ingredients!: RecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() targetItemId?: string;
  @IsString() @IsOptional() organizationId?: string; // Fixes 400 Bad Request
  @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => RecipeIngredientDto) ingredients?: RecipeIngredientDto[];
}

export class CreateProductionOrderDto {
  @IsString() @IsNotEmpty() recipeId!: string;
  @IsString() @IsNotEmpty() branchId!: string;
  @IsNumber() @Min(1) targetQty!: number;
}

export class UpdateOrderStatusDto {
  @IsString() @IsNotEmpty() status!: string;
}