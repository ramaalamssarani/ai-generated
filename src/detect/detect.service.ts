import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { Text } from './dto/text.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PhotoHistory, PhotoHistoryDocument } from 'src/users/entities/photo-history.schema';
import { Model } from 'mongoose';

@Injectable()
export class DetectService {
  constructor(
    @InjectModel(PhotoHistory.name)
    private photoHistoryModel: Model<PhotoHistoryDocument>,
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

  async checkVideo(videoPath: string) {
    const form = new FormData();

    form.append('media', fs.createReadStream(videoPath));
    form.append('models', 'genai');
    form.append('api_user', this.apiUser);
    form.append('api_secret', this.apiSecret);

    try {
      // Step 1: Submit the video for processing
      const response = await axios.post(
        'https://api.sightengine.com/1.0/video/check.json',
        form,
        {
          headers: form.getHeaders(),
        }
      );

      console.log('=== Video Submit Response ===');
      console.log(JSON.stringify(response.data, null, 2));

      const data = response.data;

      // If already finished (short video), return immediately
      if (data.data?.status === 'finished') {
        return data;
      }

      // Step 2: Poll for results until finished
      const requestId = data.request;
      if (!requestId) {
        return data; // No request ID, return what we got
      }

      const maxAttempts = 60; // Max ~3 minutes
      const delayMs = 3000; // Poll every 3 seconds

      for (let i = 0; i < maxAttempts; i++) {
        await this.delay(delayMs);

        const progressRes = await axios.get(
          'https://api.sightengine.com/1.0/check/progress.json',
          {
            params: {
              request_id: requestId,
              api_user: this.apiUser,
              api_secret: this.apiSecret,
            },
          }
        );

        console.log(`=== Video Poll #${i + 1} ===`);
        console.log(JSON.stringify(progressRes.data, null, 2));

        const progress = progressRes.data;

        if (progress.data?.status === 'finished') {
          return progress;
        }

        if (progress.data?.status === 'error') {
          return progress;
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

  async text(body: Text) {
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
    return res.data;
  }

}