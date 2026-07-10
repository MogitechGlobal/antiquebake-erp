// api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    // 1. Find the user by email, including their Role and Branch
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        branch: true,
        staff: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // 2. Compare the provided password with the stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 4. Generate the JWT Payload
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role.name,
      branchId: user.branchId 
    };

    // 5. Return the Token and User Data
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.staff.firstName,
        lastName: user.staff.lastName,
        role: user.role.name,
        branchName: user.branch.name,
        branchId: user.branchId, // <-- Add this line
      }
    };
  }
}