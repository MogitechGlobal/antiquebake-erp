// api/src/accounting/dto/accounting.dto.ts
import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  organizationId!: string;
}

export class JournalEntryDto {
  @IsString()
  accountId!: string;

  @IsNumber()
  @Min(0)
  debit!: number;

  @IsNumber()
  @Min(0)
  credit!: number;
}

export class CreateJournalDto {
  @IsString()
  branchId!: string;

  @IsString()
  description!: string;

  @IsDateString()
  @IsOptional()
  entryDate?: string; // Optional, so we use '?' instead of '!'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryDto)
  entries!: JournalEntryDto[];
}