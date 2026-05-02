import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type VideoHistoryDocument = VideoHistory & Document;

@Schema({ timestamps: true })
export class VideoHistory {

  // 📌 status (from data.status)
  @Prop({ required: true })
  status!: string;

  // 📌 request is now string (not object)
  @Prop({ required: true })
  request!: string;

  // 📌 media info
  @Prop({
    type: {
      id: String,
      uri: String,
    },
    required: true,
  })
  media!: {
    id: string;
    uri: string;
  };

  // 📌 full analysis data
  @Prop({ type: Object })
  data!: {
    status: string;
    started: number;
    last_update: number;
    operations: number;
    progress: number;
    frames: any[];
  };

  // 📌 user relation
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;
}

export const VideoHistorySchema = SchemaFactory.createForClass(VideoHistory);