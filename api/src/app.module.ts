// api/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchModule } from './branch/branch.module';
import { StaffModule } from './staff/staff.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductionModule } from './production/production.module';
import { PosModule } from './pos/pos.module';
import { ProcurementModule } from './procurement/procurement.module';
import { AccountingModule } from './accounting/accounting.module';
import { DebtorsModule } from './debtors/debtors.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    BranchModule,
    StaffModule,
    InventoryModule,
    ProductionModule,
    PosModule,
    ProcurementModule,
    AccountingModule,
    DebtorsModule
  ],
  controllers: [], 
  providers: [],
})
export class AppModule {}