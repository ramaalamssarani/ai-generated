import { Test, TestingModule } from '@nestjs/testing';
import { DetectService } from './detect.service';

describe('DetectService', () => {
  let service: DetectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DetectService],
    }).compile();

    service = module.get<DetectService>(DetectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
