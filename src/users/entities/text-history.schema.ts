import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type TextHistoryDocument = TextHistory & Document;

@Schema({ timestamps: true })
export class TextHistory {

  @Prop({ required: true })
  text!: string;

  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  request!: string;

  @Prop({ type: Object })
  profanity!: {
    matches: {
      type: string;
      intensity: string;
      match: string;
      start: number;
      end: number;
    }[];
  };

  @Prop({ type: Object })
  personal!: {
    matches: any[];
  };

  @Prop({ type: Object })
  link!: {
    matches: {
      type: string;
      category: string | null;
      match: string;
      start: number;
      end: number;
    }[];
  };

  // 📌 raw response (اختياري مهم للتطوير)
  @Prop({ type: Object })
  raw!: any;

  // 📌 user relation
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;
}

export const TextHistorySchema = SchemaFactory.createForClass(TextHistory);