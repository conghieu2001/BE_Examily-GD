import { Test, TestingModule } from '@nestjs/testing';
import { MultipeChoiceService } from './multipe-choice.service';

describe('MultipeChoiceService', () => {
  let service: MultipeChoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultipeChoiceService],
    }).compile();

    service = module.get<MultipeChoiceService>(MultipeChoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
