import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Users Service
 * 
 * Handles CRUD operations, lookups, profile settings updates,
 * and account password updates in MongoDB.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    public readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Creates a new user record
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  /**
   * Finds a user by email (explicitly selects password hash for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .exec();
  }

  /**
   * Finds a user by email (sanitized)
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /**
   * Finds a user by ID
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }
    return user;
  }

  /**
   * Updates user profile fields and settings
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found`);
    }

    return user;
  }

  /**
   * Verifies existing password and updates to new password hash
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" was not found`);
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    user.password = newPasswordHash;
    user.refreshTokenHash = null; // Revoke refresh tokens on password change
    await user.save();

    return { message: 'Password updated successfully' };
  }

  /**
   * Stores or clears the hashed refresh token for secure token rotation
   */
  async updateRefreshToken(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash }).exec();
  }

  /**
   * Stores email verification token and expiration
   */
  async setVerificationToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { verificationToken: token, verificationTokenExpires: expires },
        { new: true },
      )
      .exec();
  }

  /**
   * Verifies email: sets isEmailVerified to true and clears token
   */
  async markEmailAsVerified(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          isEmailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Stores a password reset token and expiration timestamp
   */
  async setResetPasswordToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { resetPasswordToken: token, resetPasswordExpires: expires },
        { new: true },
      )
      .exec();
  }

  /**
   * Updates password after successful reset verification
   */
  async updatePassword(
    id: string,
    newPasswordHash: string,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, {
        password: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .exec();
  }
}
