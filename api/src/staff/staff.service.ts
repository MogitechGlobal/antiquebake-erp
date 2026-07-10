// api/src/staff/staff.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(createStaffDto: CreateStaffDto) {
    const { email, password, firstName, lastName, phone, roleId, branchId } = createStaffDto;

    // 1. Check if email exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An employee with this email already exists.');
    }

    // 2. Fetch the assigned branch to validate it and extract the Organization ID
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Assigned branch not found.');
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Generate a secure, unique Employee Code
    const employeeCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 5. Create relational data safely using standard Input (connect)
    const newUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: { connect: { id: roleId } },
        branch: { connect: { id: branchId } },
        staff: {
          create: {
            firstName,
            lastName,
            phone,
            employeeCode,
            organizationId: branch.organizationId,
          },
        },
      },
      include: {
        staff: true,
        role: true,
        branch: true,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  async findAll(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        branch: { organizationId },
      },
      include: {
        staff: true,
        role: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const { firstName, lastName, phone, roleId, branchId, isActive } = updateStaffDto;

    const user = await this.prisma.user.findUnique({ where: { id }, include: { staff: true } });
    if (!user) throw new NotFoundException('Employee not found.');

    // Use strict standard Input instead of Unchecked to allow relation updates
    const updateData: Prisma.UserUpdateInput = {};
    
    if (roleId !== undefined) updateData.role = { connect: { id: roleId } };
    if (branchId !== undefined) updateData.branch = { connect: { id: branchId } };
    if (isActive !== undefined) updateData.isActive = isActive;

    if (firstName !== undefined || lastName !== undefined || phone !== undefined) {
      updateData.staff = {
        update: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
        },
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        role: true,
        branch: true,
      },
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  }
}