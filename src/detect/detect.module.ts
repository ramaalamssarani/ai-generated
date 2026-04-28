import { Module } from '@nestjs/common';
import { DetectService } from './detect.service';
import { DetectController } from './detect.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotoHistory, PhotoHistorySchema } from '../users/entities/photo-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhotoHistory.name, schema: PhotoHistorySchema },
    ]),
  ],
  controllers: [DetectController],
  providers: [DetectService],
})
export class DetectModule {}
