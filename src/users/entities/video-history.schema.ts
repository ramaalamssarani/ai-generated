import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type VideoHistoryDocument = VideoHistory & Document;

@Schema({ timestamps: true })
export class VideoHistory {
  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  request!: string;

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

  @Prop({ type: Number })
  ai_score?: number;

  @Prop({ type: Object })
  data!: {
    status: string;
    started: number;
    last_update: number;
    operations: number;
    progress: number;
    frames: Array<{
      info: { id: string; position: number };
      type: { ai_generated: number };
    }>;
  };

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;
}

export const VideoHistorySchema = SchemaFactory.createForClass(VideoHistory);