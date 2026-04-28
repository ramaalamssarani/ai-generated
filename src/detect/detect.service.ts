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
  ) {}
  private apiUser = '1785207820';
  private apiSecret = 'HGhmWjrGqDfm6qnCbTbV2tnFx3UKTxDR';

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
      const response = await axios.post(
        'https://api.sightengine.com/1.0/video/check.json',
        form,
        {
          headers: form.getHeaders(),
        }
      );

      return response.data;

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) return error.response.data;
        return { error: error.message };
      }
      return { error: 'Unknown error' };
    }
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