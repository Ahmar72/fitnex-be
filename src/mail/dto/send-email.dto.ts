import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Send Email DTO
 * Defines the payload for dispatching transactional emails.
 */
export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;

  @IsString()
  @IsOptional()
  text?: string;
}
