import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { staff: true }
    });

    if (!user) throw new NotFoundException('User profile not found');

    // Ensure the new email isn't already taken by another account
    if (data.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        throw new ConflictException('Email address is already in use.');
      }
    }

    // Run updates in a transaction to ensure database consistency
    const updatedUser = await this.prisma.$transaction(async (prisma) => {
      // 1. Update Staff Record (Names & Phone)
      await prisma.staff.update({
        where: { id: user.staffId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        }
      });

      // 2. Update User Record (Email Sync)
      return prisma.user.update({
        where: { id: userId },
        data: { email: data.email },
        include: {
          staff: true,
          role: true,
          branch: true
        }
      });
    });

    // Format the return object to match the exact schema expected by the frontend Zustand authStore
    return {
      id: updatedUser.id,
      firstName: updatedUser.staff.firstName,
      lastName: updatedUser.staff.lastName,
      email: updatedUser.email,
      role: updatedUser.role.name,
      branchName: updatedUser.branch.name,
      branchId: updatedUser.branchId,
      phone: updatedUser.staff.phone,
    };
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // 1. Verify the current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password.');
    }

    // 2. Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);

    // 3. Update the database record
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password successfully updated' };
  }
}