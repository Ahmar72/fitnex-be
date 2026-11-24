import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

/**
 * Mail Service
 * 
 * Delivers branded transactional emails (verification, welcome, password reset)
 * via Nodemailer using Mailtrap SMTP credentials.
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
      return false;
    }
  }

  /**
   * Base HTML Email Layout Template
   * Wraps email content in the Fitnex signature dark slate & vibrant orange design.
   */
  private wrapTemplate(title: string, preheaderText: string, contentHtml: string): string {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F8FAFC;
      padding: 40px 0;
    }
    .main {
      background-color: #FFFFFF;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 3px solid #EA580C;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #FFFFFF;
      text-transform: uppercase;
      margin: 0;
    }
    .logo-orange {
      color: #EA580C;
    }
    .tagline {
      font-size: 11px;
      color: #94A3B8;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 6px;
      font-weight: 600;
    }
    .body-content {
      padding: 36px 32px;
    }
    .h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .p {
      font-size: 15px;
      line-height: 1.65;
      color: #475569;
      margin: 0 0 18px 0;
    }
    .otp-container {
      background: #F1F5F9;
      border: 2px dashed #CBD5E1;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #EA580C;
      margin: 0;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .btn {
      display: inline-block;
      background-color: #EA580C;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
    }
    .features-card {
      background-color: #FFF7ED;
      border-left: 4px solid #EA580C;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 24px 0;
    }
    .features-title {
      color: #9A3412;
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .features-list {
      margin: 0;
      padding-left: 20px;
      color: #7C2D12;
      font-size: 14px;
      line-height: 1.6;
    }
    .note {
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.5;
      margin-top: 24px;
      border-top: 1px solid #F1F5F9;
      padding-top: 18px;
    }
    .footer {
      background-color: #0F172A;
      color: #64748B;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
    }
    .footer a {
      color: #EA580C;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${preheaderText}
  </div>
  <table class="wrapper" role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <div class="main">
          <!-- Header -->
          <div class="header">
            <h1 class="logo">FIT<span class="logo-orange">NEX</span></h1>
            <div class="tagline">Performance & Nutrition Engine</div>
          </div>
          <!-- Body -->
          <div class="body-content">
            ${contentHtml}
          </div>
          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} Fitnex Inc. All rights reserved.</p>
            <p style="margin: 0;">
              <a href="${frontendUrl}">Open Fitnex App</a> &bull; 
              <a href="${frontendUrl}/privacy">Privacy Policy</a> &bull; 
              <a href="${frontendUrl}/contact">Support</a>
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Sends Account Verification Email with OTP Code
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

    const subject = 'Verify Your Fitnex Account ✉️';
    const content = `
      <h2 class="h1">Verify your email address</h2>
      <p class="p">Hi <strong>${name}</strong>,</p>
      <p class="p">
        Thank you for joining Fitnex. To complete your registration and activate your personalized training and nutrition profile, please verify your email using the secure 6-digit code below:
      </p>

      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${token}</div>
      </div>

      <div class="btn-container">
        <a href="${verifyUrl}" class="btn">Verify Account Now &rarr;</a>
      </div>

      <p class="note">
        This verification code is valid for <strong>24 hours</strong>. If you did not create a Fitnex account, please disregard this email.
      </p>
    `;

    const html = this.wrapTemplate('Verify Your Fitnex Account', 'Confirm your email to get started with Fitnex', content);

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hi ${name}, your Fitnex verification code is: ${token}. Use this code or visit ${verifyUrl} to activate your account.`,
    });
  }

  /**
   * Sends Styled Welcome Email to newly registered user
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const subject = 'Welcome to Fitnex! 🏋️‍♂️';

    const content = `
      <h2 class="h1">Welcome to the Fitnex family!</h2>
      <p class="p">Hi <strong>${name}</strong>,</p>
      <p class="p">
        Your account is verified and ready. You now have full access to our intelligent training suite, metabolic calculators, and workout tracking tools.
      </p>

      <div class="features-card">
        <div class="features-title">What you can do right now:</div>
        <ul class="features-list">
          <li><strong>1,324+ Animated Movements</strong>: Filter by muscle, target, and equipment.</li>
          <li><strong>Guided Workouts</strong>: Live auto rest timers and multilingual voice coach.</li>
          <li><strong>Custom Split Builder</strong>: Design and save custom training routines.</li>
          <li><strong>Metabolic Tracker</strong>: Track daily calories, macros, and workout streaks.</li>
        </ul>
      </div>

      <div class="btn-container">
        <a href="${frontendUrl}/dashboard" class="btn">Start Your Training &rarr;</a>
      </div>

      <p class="p" style="margin-top: 24px;">
        Need any help or personalized guidance? Reply directly to this email or visit our help center anytime.
      </p>
      <p class="p" style="margin-bottom: 0;">
        Stay strong,<br><strong>The Fitnex Team</strong>
      </p>
    `;

    const html = this.wrapTemplate('Welcome to Fitnex', 'Your fitness journey starts today', content);

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hi ${name}, welcome to Fitnex! Your account is ready. Visit ${frontendUrl} to start training.`,
    });
  }

  /**
   * Sends Password Reset Email with Token & Button
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    const subject = 'Fitnex - Password Reset Request 🔑';
    const content = `
      <h2 class="h1">Reset your password</h2>
      <p class="p">Hello <strong>${name}</strong>,</p>
      <p class="p">
        We received a request to reset the password for your Fitnex account. You can reset your password using the secure code below or by clicking the button:
      </p>

      <div class="otp-container">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${token}</div>
      </div>

      <div class="btn-container">
        <a href="${resetUrl}" class="btn">Reset Password &rarr;</a>
      </div>

      <p class="note">
        This reset code expires in <strong>1 hour</strong>. If you did not initiate this request, your account remains secure and you can safely ignore this message.
      </p>
    `;

    const html = this.wrapTemplate('Fitnex Password Reset', 'Reset your Fitnex account password', content);

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hello ${name}, your password reset code is: ${token}. Reset your password at ${resetUrl}`,
    });
  }

  /**
   * Sends Password Reset Confirmation Email
   */
  async sendPasswordResetSuccessEmail(to: string, name: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const subject = 'Fitnex - Password Successfully Changed ✅';

    const content = `
      <h2 class="h1">Password changed successfully</h2>
      <p class="p">Hello <strong>${name}</strong>,</p>
      <p class="p">
        This is a confirmation that the password for your Fitnex account (<strong>${to}</strong>) was just successfully changed.
      </p>
      <p class="p">
        You can now sign in with your new credentials.
      </p>

      <div class="btn-container">
        <a href="${frontendUrl}/login" class="btn">Log In to Fitnex &rarr;</a>
      </div>

      <p class="note">
        If you did NOT make this change, please contact our support team immediately to secure your account.
      </p>
    `;

    const html = this.wrapTemplate('Password Changed Successfully', 'Your Fitnex password has been updated', content);

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hello ${name}, your Fitnex password has been successfully updated. Log in at ${frontendUrl}/login`,
    });
  }
}
