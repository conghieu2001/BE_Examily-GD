import { Test, TestingModule } from '@nestjs/testing';
import { SubmitAnswerService } from './submit-answer.service';

describe('SubmitAnswerService', () => {
  let service: SubmitAnswerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubmitAnswerService],
    }).compile();

    service = module.get<SubmitAnswerService>(SubmitAnswerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
