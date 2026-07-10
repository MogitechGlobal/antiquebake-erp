import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('roles')
export class RoleController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }
}