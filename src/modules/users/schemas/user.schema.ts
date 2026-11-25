import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

/**
 * User Mongoose Schema
 * 
 * Stores user account credentials, profile data, roles, application settings,
 * and security tokens. Sensitive fields are hidden from JSON transforms and queries.
 */
@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshTokenHash;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.verificationToken;
      delete ret.verificationTokenExpires;
      return ret;
    },
  },
})
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null, select: false })
  verificationToken: string;

  @Prop({ default: null, select: false })
  verificationTokenExpires: Date;

  @Prop({ default: null, select: false })
  refreshTokenHash: string;

  @Prop({ default: null, select: false })
  resetPasswordToken: string;

  @Prop({ default: null, select: false })
  resetPasswordExpires: Date;

  @Prop({ default: 'en' })
  preferredLanguage: string;

  @Prop({ default: 'kg', enum: ['kg', 'lbs'] })
  weightUnit: string;

  @Prop({ default: 'cm', enum: ['cm', 'ft'] })
  heightUnit: string;

  @Prop({ default: 'dark', enum: ['system', 'light', 'dark'] })
  theme: string;

  @Prop({ default: true })
  voiceGuidelines: boolean;

  @Prop({ default: 60 })
  restTimerSeconds: number;

  @Prop({ type: Object, default: {} })
  profile: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
