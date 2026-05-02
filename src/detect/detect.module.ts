import { Module } from '@nestjs/common';
import { DetectService } from './detect.service';
import { DetectController } from './detect.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotoHistory, PhotoHistorySchema } from '../users/entities/photo-history.schema';
import { VideoHistory, VideoHistorySchema } from 'src/users/entities/video-history.schema';
import { TextHistory , TextHistorySchema } from 'src/users/entities/text-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhotoHistory.name, schema: PhotoHistorySchema },
      { name: VideoHistory.name, schema: VideoHistorySchema },
      { name: TextHistory.name, schema: TextHistorySchema },
    ]),
  ],
  controllers: [DetectController],
  providers: [DetectService],
})
export class DetectModule {}
