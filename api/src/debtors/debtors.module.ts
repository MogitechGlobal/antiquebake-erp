import { Module } from '@nestjs/common';
import { DebtorsService } from './debtors.service';
import { DebtorsController } from './debtors.controller';

@Module({
  providers: [DebtorsService],
  controllers: [DebtorsController]
})
export class DebtorsModule {}
