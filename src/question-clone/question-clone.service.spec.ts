import { Test, TestingModule } from '@nestjs/testing';
import { QuestionCloneService } from './question-clone.service';

describe('QuestionCloneService', () => {
  let service: QuestionCloneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionCloneService],
    }).compile();

    service = module.get<QuestionCloneService>(QuestionCloneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
