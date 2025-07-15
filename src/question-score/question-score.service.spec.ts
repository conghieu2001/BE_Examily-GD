import { Test, TestingModule } from '@nestjs/testing';
import { QuestionScoreService } from './question-score.service';

describe('QuestionScoreService', () => {
  let service: QuestionScoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionScoreService],
    }).compile();

    service = module.get<QuestionScoreService>(QuestionScoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
