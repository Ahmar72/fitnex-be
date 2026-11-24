import { ApiProperty } from '@nestjs/swagger';

/**
 * User Info nested inside AuthResponse
 */
export class AuthUserDataDto {
  @ApiProperty({ example: '67431234567890abcdef1234' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Alex Mercer' })
  name: string;

  @ApiProperty({ example: 'user' })
  role: string;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: 'en' })
  preferredLanguage: string;
}

/**
 * Authentication Response DTO
 */
export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token used in Bearer authorization header',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token used to obtain a new access token',
  })
  refreshToken: string;

  @ApiProperty({
    type: AuthUserDataDto,
    description: 'Authenticated user profile details',
  })
  user: AuthUserDataDto;
}
