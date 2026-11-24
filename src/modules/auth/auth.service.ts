import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDocument } from '../users/schemas/user.schema';

/**
 * Authentication Service
 * 
 * Handles user registration, credential validation, JWT token issuance,
 * refresh token rotation, email verification, and Mailtrap transactional notifications.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Registers a new user, hashes password, generates verification OTP,
   * saves in MongoDB, and dispatches verification email via Mailtrap.
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    // Hash the password with bcrypt (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Create user in database
    const createdUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate 6-digit email verification code with 24-hour expiration
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.usersService.setVerificationToken(
      createdUser._id.toString(),
      verificationCode,
      expires,
    );

    // Generate JWT access and refresh tokens
    const tokens = await this.generateTokens(createdUser);

    // Save hashed refresh token for secure token rotation
    await this.updateRefreshToken(createdUser._id.toString(), tokens.refreshToken);

    // Dispatch verification email via Mailtrap asynchronously
    this.mailService
      .sendVerificationEmail(createdUser.email, createdUser.name, verificationCode)
      .catch((err) => this.logger.warn(`Verification email dispatch skipped: ${err.message}`));

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: createdUser._id.toString(),
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        isEmailVerified: createdUser.isEmailVerified,
        preferredLanguage: createdUser.preferredLanguage,
      },
    };
  }

  /**
   * Validates 6-digit verification code and marks account verified
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
    message: string;
    accessToken?: string;
    refreshToken?: string;
    user?: any;
  }> {
    const { email, token } = verifyEmailDto;

    const user = await this.usersService.userModel
      .findOne({
        email: email.toLowerCase().trim(),
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
      })
      .select('+verificationToken +verificationTokenExpires')
      .exec();

    if (!user) {
      throw new BadRequestException('Verification code is invalid or has expired');
    }

    // Mark email verified
    await this.usersService.markEmailAsVerified(user._id.toString());
    user.isEmailVerified = true;

    // Generate JWT access and refresh tokens for immediate authentication
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    // Dispatch styled Welcome email now that email is confirmed
    this.mailService
      .sendWelcomeEmail(user.email, user.name)
      .catch((err) => this.logger.warn(`Welcome email dispatch skipped: ${err.message}`));

    return {
      message: 'Email verified successfully! Welcome to Fitnex.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: true,
        preferredLanguage: user.preferredLanguage,
      },
    };
  }

  /**
   * Resends verification code to user
   */
  async resendVerification(resendDto: ResendVerificationDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(resendDto.email);

    if (!user) {
      return {
        message: 'If an account with that email exists, a new verification code has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return {
        message: 'This account email is already verified. You can log in directly.',
      };
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.usersService.setVerificationToken(user._id.toString(), verificationCode, expires);

    // Dispatch via Mailtrap
    await this.mailService.sendVerificationEmail(user.email, user.name, verificationCode);

    return {
      message: 'If an account with that email exists, a new verification code has been sent.',
    };
  }

  /**
   * Validates user credentials and issues tokens
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store hashed refresh token
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferredLanguage: user.preferredLanguage,
      },
    };
  }

  /**
   * Refreshes access token using a valid refresh token (Token Rotation)
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const refreshSecret =
        this.configService.get<string>('jwt.refreshSecret') ||
        'fitnex_super_secret_jwt_refresh_key_2026';

      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.usersService.userModel
        .findById(payload.sub)
        .select('+refreshTokenHash')
        .exec();
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access denied. Invalid refresh token.');
      }

      // Verify stored hashed refresh token against incoming token
      const isRefreshMatch = await bcrypt.compare(
        refreshTokenDto.refreshToken,
        user.refreshTokenHash,
      );

      if (!isRefreshMatch) {
        throw new UnauthorizedException('Access denied. Invalid or rotated refresh token.');
      }

      // Generate new pair of tokens
      const tokens = await this.generateTokens(user);

      // Rotate: update the stored refresh token hash
      await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          preferredLanguage: user.preferredLanguage,
        },
      };
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  /**
   * Logs out the user by clearing their hashed refresh token
   */
  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  /**
   * Initiates forgot-password workflow: generates token & sends Mailtrap email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    // For security reasons, don't reveal if email does not exist
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate a secure 6-digit or random hex token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await this.usersService.setResetPasswordToken(user.email, resetToken, expires);

    // Send email via Mailtrap Nodemailer
    await this.mailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Resets password using valid reset token and sends confirmation email
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Search user with valid, non-expired token
    const user = await this.usersService.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      })
      .select('+resetPasswordToken +resetPasswordExpires')
      .exec();

    if (!user) {
      throw new BadRequestException('Password reset token is invalid or has expired');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await this.usersService.updatePassword(user._id.toString(), newPasswordHash);
    await this.usersService.updateRefreshToken(user._id.toString(), null);

    // Dispatch confirmation email
    this.mailService
      .sendPasswordResetSuccessEmail(user.email, user.name)
      .catch((err) => this.logger.warn(`Reset confirmation email skipped: ${err.message}`));

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  /**
   * Generates JWT Access and Refresh tokens
   */
  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessSecret =
      this.configService.get<string>('jwt.secret') || 'fitnex_super_secret_jwt_access_key_2026';
    const accessExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';

    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      'fitnex_super_secret_jwt_refresh_key_2026';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Stores hashed refresh token in database
   */
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(refreshToken, salt);
    await this.usersService.updateRefreshToken(userId, hash);
  }
}
