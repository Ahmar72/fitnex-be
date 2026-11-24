import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

/**
 * Mail Service
 * 
 * Handles sending transactional and notification emails using Nodemailer
 * configured with Mailtrap SMTP sandbox credentials.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host', 'sandbox.smtp.mailtrap.io');
    const port = this.configService.get<number>('mail.port', 2525);
    const user = this.configService.get<string>('mail.user', '');
    const pass = this.configService.get<string>('mail.pass', '');
    this.fromAddress = this.configService.get<string>(
      'mail.from',
      '"Fitnex Team" <no-reply@fitnex.com>',
    );

    // Initialize the Nodemailer transporter for Mailtrap
    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log(`Mail service initialized with host [${host}:${port}]`);
  }

  /**
   * Generic mail sender
   */
  async sendMail(payload: SendEmailDto): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      this.logger.log(`Email successfully sent to [${payload.to}] (Message ID: ${info.messageId})`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to [${payload.to}]: ${error.message}`);
      // Do not throw so app flow continues even if email sandbox fails
      return false;
    }
  }

  /**
   * Sends a styled Welcome email to a newly registered user
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Fitnex! 🏋️‍♂️';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #EA580C; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Welcome to Fitnex!</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
          <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6;">
            We are thrilled to have you join Fitnex — your personalized fitness tracking, workout builder, and nutrition companion.
          </p>
          <div style="background-color: #FFF7ED; border-left: 4px solid #EA580C; padding: 12px 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #9A3412;">What you can do now:</p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #7C2D12;">
              <li>Explore 1,300+ animated exercise demonstrations</li>
              <li>Build and follow custom split training routines</li>
              <li>Track calories, macros, and workout streaks</li>
            </ul>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Best regards,<br>
            <strong>The Fitnex Team</strong>
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hi ${name}, welcome to Fitnex! We are thrilled to have you join. Explore workouts, track nutrition, and reach your goals.`,
    });
  }

  /**
   * Sends a styled Password Reset email with token/link
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    const subject = 'Fitnex - Password Reset Request 🔑';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #1F2937; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset Request</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
          <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6;">
            We received a request to reset your Fitnex account password. Use the secure token below or click the button to proceed:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <div style="display: inline-block; background-color: #F3F4F6; padding: 12px 24px; font-family: monospace; font-size: 20px; letter-spacing: 2px; font-weight: bold; border-radius: 6px; border: 1px solid #D1D5DB;">
              ${token}
            </div>
          </div>
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${resetUrl}" style="background-color: #EA580C; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="font-size: 13px; color: #9CA3AF; line-height: 1.5;">
            This reset code is valid for 1 hour. If you did not request a password reset, please ignore this email; your account remains secure.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hello ${name}, your password reset token is: ${token}. Use this link to reset: ${resetUrl}`,
    });
  }
}
