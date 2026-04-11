import { Test, TestingModule } from '@nestjs/testing';
import { DetectController } from './detect.controller';
import { DetectService } from './detect.service';

describe('DetectController', () => {
  let controller: DetectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DetectController],
      providers: [DetectService],
    }).compile();

    controller = module.get<DetectController>(DetectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
