import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailVerificationDocument = EmailVerification & Document;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);

EmailVerificationSchema.index({ token: 1 }, { unique: true });
EmailVerificationSchema.index({ userId: 1, isUsed: 1 });
EmailVerificationSchema.index({ expiresAt: 1, isUsed: 1 });
