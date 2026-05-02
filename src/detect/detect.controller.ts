import { Controller, Post, Body, UsePipes, ValidationPipe, UseInterceptors, UploadedFile, UseGuards, Req, Get } from '@nestjs/common';
import { DetectService } from './detect.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Text } from './dto/text.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('detect')
export class DetectController {
  constructor(private readonly detectService: DetectService) { }

  @Post('image')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
  }))
  @UseGuards(JwtAuthGuard)
  async image(@UploadedFile() file: Express.Multer.File , @Req() req: any) {
    return await this.detectService.checkAI(file.path , req.user._id);
  }

  @Get('historiesImage')
  @UseGuards(JwtAuthGuard)
  async historiesImage(@Req() req: any) {
    return await this.detectService.historiesImage(req.user._id);
  }

  @Post('video')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseInterceptors(FileInterceptor('video', {
    storage: diskStorage({
      destination: './uploads/videos',
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.startsWith('video/')) {
        return callback(new Error('Only video files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  @UseGuards(JwtAuthGuard)
  async video(@UploadedFile() file: Express.Multer.File , @Req() req: any) {
    return await this.detectService.checkVideo(file.path , req.user._id);
  }

  @Get('historiesVideo')
  @UseGuards(JwtAuthGuard)
  async historiesVideo(@Req() req: any) {
    return await this.detectService.historiesVideo(req.user._id);
  }

  @Post('text')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(JwtAuthGuard)
  async text(@Body() body: Text , @Req() req: any) {
    return this.detectService.text(body , req.user._id);
  }

  @Get('TextHistory')
  @UseGuards(JwtAuthGuard)
  async TextHistory(@Req() req: any) {
    return await this.detectService.TextHistory(req.user._id);
  }
}