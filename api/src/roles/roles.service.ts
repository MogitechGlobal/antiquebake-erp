// api/src/roles/roles.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if your PrismaService is located elsewhere
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    // Check if role name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('A role with this name already exists.');
    }

    return this.prisma.role.create({
      data: createRoleDto,
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: [
        { department: 'asc' },
        { name: 'asc' }
      ],
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    // Ensure the role exists before updating
    await this.findOne(id); 

    // If attempting to update the name, check for uniqueness conflicts
    if (updateRoleDto.name) {
      const nameConflict = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });
      if (nameConflict && nameConflict.id !== id) {
        throw new ConflictException('Another role with this name already exists.');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists before deleting

    return this.prisma.role.delete({
      where: { id },
    });
  }
}