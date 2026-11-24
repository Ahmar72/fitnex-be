/**
 * Application Environment Configuration
 * 
 * Provides centralized, type-safe access to environment variables
 * with sensible fallback values for development.
 */
export const envConfig = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // MongoDB Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fitnex',
  },

  // JWT Authentication Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fitnex_super_secret_jwt_access_key_2026',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fitnex_super_secret_jwt_refresh_key_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Mailtrap & Nodemailer Configuration
  mail: {
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT || '2525', 10),
    user: process.env.MAIL_USER || 'fitnex_mailtrap_user',
    pass: process.env.MAIL_PASS || 'fitnex_mailtrap_pass',
    from: process.env.MAIL_FROM || '"Fitnex Team" <no-reply@fitnex.com>',
  },
});
