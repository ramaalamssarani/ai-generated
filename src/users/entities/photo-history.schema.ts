import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type PhotoHistoryDocument = PhotoHistory & Document;

@Schema({ timestamps: true })
export class PhotoHistory {

  @Prop({ required: true })
  status!: string;

  @Prop({ type: Object })
  request!: {
    id: string;
    timestamp: number;
    operations: number;
  };

  @Prop({ type: Object })
  type: any;

  @Prop({ type: Object })
  media!: {
    id: string;
    uri: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;
}

export const PhotoHistorySchema = SchemaFactory.createForClass(PhotoHistory);