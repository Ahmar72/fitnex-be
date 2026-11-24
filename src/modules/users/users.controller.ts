import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from './schemas/user.schema';

/**
 * Users Controller
 * 
 * Exposes endpoints for managing authenticated user profiles.
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired token',
  })
  async getProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.findById(user._id.toString());
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates display name, avatar, or preferred voice/UI language.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired token',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }
}
