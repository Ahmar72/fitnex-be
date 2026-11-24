import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

/**
 * User Mongoose Schema
 * 
 * Stores user account credentials, profile data, roles,
 * and security tokens. Sensitive fields are hidden from JSON transforms.
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

  @Prop({ required: true })
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

  @Prop({ default: null })
  refreshTokenHash: string;

  @Prop({ default: null })
  resetPasswordToken: string;

  @Prop({ default: null })
  resetPasswordExpires: Date;

  @Prop({ default: 'en' })
  preferredLanguage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
