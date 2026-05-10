import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { Text } from './dto/text.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PhotoHistory, PhotoHistoryDocument } from 'src/users/entities/photo-history.schema';
import { Model, Types } from 'mongoose';
import { VideoHistory, VideoHistoryDocument } from 'src/users/entities/video-history.schema';
import { TextHistory, TextHistoryDocument } from 'src/users/entities/text-history.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DetectService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(PhotoHistory.name)
    private photoHistoryModel: Model<PhotoHistoryDocument>,
    @InjectModel(VideoHistory.name)
    private videoHistoryModel: Model<VideoHistoryDocument>,
    @InjectModel(TextHistory.name)
    private textHistoryModel: Model<TextHistoryDocument>,

  ) { }

  private getSightengineCredentials() {
    const apiUser = this.configService.get<string>('SIGHTENGINE_API_USER');
    const apiSecret = this.configService.get<string>('SIGHTENGINE_API_SECRET');

    if (!apiUser || !apiSecret) {
      throw new InternalServerErrorException(
        'Sightengine credentials are not configured',
      );
    }

    return { apiUser, apiSecret };
  }

  async checkAI(imagePath: string, userId: string) {
    const { apiUser, apiSecret } = this.getSightengineCredentials();
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('models', 'genai');
    form.append('api_user', apiUser);
    form.append('api_secret', apiSecret);

    try {
      const response = await axios.post(
        'https://api.sightengine.com/1.0/check.json',
        form,
        { headers: form.getHeaders() },
      );

      const saved = await this.photoHistoryModel.create({
        status: response.data.status,
        request: response.data.request,
        type: response.data.type,
        media: response.data.media,
        user: userId,
      });

      return response.data;

    } catch (error) {
      const err = error as any;

      const errorData = err.response
        ? err.response.data
        : { error: err.message || 'Unknown error' };

      await this.photoHistoryModel.create({
        status: 'error',
        request: {
          id: '',
          timestamp: Date.now(),
          operations: 0,
        },
        type: errorData,
        media: {
          id: '',
          uri: imagePath,
        },
        user: userId,
      });

      return errorData;
    }
  }

  async historiesImage(userId: string) {
    return this.photoHistoryModel
      .find({ user: userId })
      .exec();
  }

  async checkVideo(videoPath: string, userId: string) {
    const { apiUser, apiSecret } = this.getSightengineCredentials();
    const form = new FormData();
    form.append('media', fs.createReadStream(videoPath));
    form.append('models', 'genai'); // تحديد موديل الـ GenAI
    form.append('api_user', apiUser);
    form.append('api_secret', apiSecret);

    try {
      const response = await axios.post(
        'https://api.sightengine.com/1.0/video/check.json',
        form,
        { headers: form.getHeaders() }
      );

      const initialData = response.data;
      const mediaId = initialData.media?.id;

      if (!mediaId) return initialData;

      const maxAttempts = 60;
      const delayMs = 3000;

      for (let i = 0; i < maxAttempts; i++) {
        await this.delay(delayMs);

        const progressRes = await axios.get(
          'https://api.sightengine.com/1.0/video/byid.json',
          {
            params: {
              id: mediaId,
              api_user: apiUser,
              api_secret: apiSecret,
            },
          }
        );

        const fullResult = progressRes.data;
        const status = fullResult.output?.data?.status;

        if (status === 'finished') {
          const outputData = fullResult.output.data;

          // استخراج النسبة من أول فريم (حسب الـ JSON تبعك)
          // إذا كان هناك أكثر من فريم، يمكنك أخذ القيمة الأعلى أو المتوسط
          const aiScore = outputData.frames?.[0]?.type?.ai_generated ?? 0;

          await this.videoHistoryModel.create({
            status: status,
            request: fullResult.request?.id,
            media: {
              id: mediaId,
              uri: initialData.media.uri,
            },
            ai_score: aiScore, // تخزين النسبة بشكل مباشر لسهولة القراءة
            data: outputData,
            user: new Types.ObjectId(userId),
          });

          return outputData;
        }

        if (status === 'failure') {
          return { error: 'Processing failed', details: fullResult.output.data };
        }
      }

      return { error: 'Video processing timed out' };

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response ? error.response.data : { error: error.message };
      }
      return { error: 'Unknown error' };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async historiesVideo(userId: string) {
    return this.videoHistoryModel
      .find({ user: userId })
      .exec();
  }


  async text(body: Text, userId: string) {
    const { apiUser, apiSecret } = this.getSightengineCredentials();
    const res = await axios.post(
      'https://api.sightengine.com/1.0/text/check.json',
      new URLSearchParams({
        text: body.text,
        lang: 'en',
        mode: 'standard',
        api_user: apiUser,
        api_secret: apiSecret,
      }),
    );

    const data = res.data;

    // 💾 SAVE TO DB
    const saved = await this.textHistoryModel.create({
      text: body.text,
      status: data.status,
      request: data.request?.id,
      profanity: data.profanity,
      personal: data.personal,
      link: data.link,
      raw: data,
      user: new Types.ObjectId(userId),
    });

    return data;
  }
  async TextHistory(userId: string) {
    return this.textHistoryModel
      .find({ user: userId })
      .exec();
  }
}
