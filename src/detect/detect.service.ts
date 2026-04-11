import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

@Injectable()
export class DetectService {
  private apiUser = '1785207820';      // استبدل بـ API user الخاص بك
  private apiSecret = 'HGhmWjrGqDfm6qnCbTbV2tnFx3UKTxDR'; // استبدل بـ API secret

  async checkAI(imagePath: string) {
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('models', 'genai');
    form.append('api_user', this.apiUser);
    form.append('api_secret', this.apiSecret);

    try {
      const response = await axios.post(
        'https://api.sightengine.com/1.0/check.json',
        form,
        { headers: form.getHeaders() }
      );

      return response.data;
    } catch (error) {
      const err = error as any;
      if (err.response) return err.response.data;
      return { error: err.message || 'Unknown error' };
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
}