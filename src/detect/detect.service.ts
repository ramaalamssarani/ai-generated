import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { Text } from './dto/text.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PhotoHistory, PhotoHistoryDocument } from 'src/users/entities/photo-history.schema';
import { Model, Types } from 'mongoose';
import { VideoHistory, VideoHistoryDocument } from 'src/users/entities/video-history.schema';
import { TextHistory, TextHistoryDocument } from 'src/users/entities/text-history.schema';

@Injectable()
export class DetectService {
  constructor(
    @InjectModel(PhotoHistory.name)
    private photoHistoryModel: Model<PhotoHistoryDocument>,
    @InjectModel(VideoHistory.name)
    private videoHistoryModel: Model<VideoHistoryDocument>,
    @InjectModel(TextHistory.name)
    private textHistoryModel: Model<TextHistoryDocument>,

  ) { }
  private apiUser = '673764221';
  private apiSecret = 'ckReHshLPQiB5XkjvZuQhynBVKCtxb77';

  async checkAI(imagePath: string, userId: string) {
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('models', 'genai');
    form.append('api_user', this.apiUser);
    form.append('api_secret', this.apiSecret);

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
    const form = new FormData();

    form.append('media', fs.createReadStream(videoPath));
    form.append('models', 'genai');
    form.append('api_user', this.apiUser);
    form.append('api_secret', this.apiSecret);

    try {
      const response = await axios.post(
        'https://api.sightengine.com/1.0/video/check.json',
        form,
        {
          headers: form.getHeaders(),
        }
      );

      const data = response.data;

      const mediaId = data.media?.id;
      const requestId = data.request?.id;

      if (!mediaId) {
        return data;
      }

      const maxAttempts = 60;
      const delayMs = 3000;

      for (let i = 0; i < maxAttempts; i++) {
        await this.delay(delayMs);

        const progressRes = await axios.get(
          'https://api.sightengine.com/1.0/video/byid.json',
          {
            params: {
              id: mediaId,
              api_user: this.apiUser,
              api_secret: this.apiSecret,
            },
          }
        );

        const progress = progressRes.data;

        const output = progress.output;

        if (output?.data?.status === 'finished') {

          // 💾 SAVE TO DB
          const saved = await this.videoHistoryModel.create({
            status: output.data.status,
            request: requestId,
            media: {
              id: data.media.id,
              uri: data.media.uri,
            },
            data: output.data,
            user: new Types.ObjectId(userId),
          });

          return data;
        }

        if (output?.data?.status === 'error') {
          return output;
        }
      }

      return { error: 'Video processing timed out' };

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) return error.response.data;
        return { error: error.message };
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
    const res = await axios.post(
      'https://api.sightengine.com/1.0/text/check.json',
      new URLSearchParams({
        text: body.text,
        lang: 'en',
        mode: 'standard',
        api_user: this.apiUser,
        api_secret: this.apiSecret,
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