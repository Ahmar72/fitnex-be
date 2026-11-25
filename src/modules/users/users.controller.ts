import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Users Controller
 * 
 * Exposes endpoints for managing authenticated user profiles,
 * application settings, and account password changes.
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile (standard)',
    description: 'Retrieves profile information and settings of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getMe(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.usersService.findById(userId);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile (alias for /me)',
    description: 'Retrieves profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@CurrentUser() user: any) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.usersService.findById(userId);
  }

  @Patch('me/profile')
  @ApiOperation({
    summary: 'Update current user profile and settings (standard)',
    description: 'Updates display name, avatar, preferred language, theme, units, and guidelines.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateMeProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update current user profile (alias for /me/profile)',
    description: 'Updates display name, avatar, or preferred voice/UI language.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change account password (standard)',
    description: 'Verifies current password and updates to new password hash. Automatically revokes active refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current password does not match or validation failed',
  })
  async changeMePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.usersService.changePassword(userId, dto);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change account password (alias for /me/password)',
    description: 'Verifies current password and updates account password.',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = user?.id || user?._id?.toString() || user;
    return this.usersService.changePassword(userId, dto);
  }
}
