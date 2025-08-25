import { Test, TestingModule } from '@nestjs/testing';
import { QuestionScoreController } from './question-score.controller';
import { QuestionScoreService } from './question-score.service';

describe('QuestionScoreController', () => {
  let controller: QuestionScoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionScoreController],
      providers: [QuestionScoreService],
    }).compile();

    controller = module.get<QuestionScoreController>(QuestionScoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
