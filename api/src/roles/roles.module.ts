// api/src/roles/roles.module.ts
import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule

@Module({
  imports: [PrismaModule], // Make PrismaService available
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService], // Export in case the Users/Staff modules need to validate roles
})
export class RolesModule {}