import { Controller, Put, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

interface RequestWithUser extends Request {
  user: {
    userId?: string;
    sub?: string;
    email?: string;
    role?: string;
  };
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put()
  async updateProfile(
    @Req() req: RequestWithUser, // Explicitly type the req parameter
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    // Extract the user ID safely without TypeScript complaining
    const userId = req.user.userId || req.user.sub; 
    
    // Ensure userId is treated as a string by the service
    return this.profileService.updateProfile(userId as string, updateProfileDto);
  }

  @Put('password')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.profileService.changePassword(userId as string, changePasswordDto);
  }
}