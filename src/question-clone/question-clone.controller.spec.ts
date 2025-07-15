import { Test, TestingModule } from '@nestjs/testing';
import { QuestionCloneController } from './question-clone.controller';
import { QuestionCloneService } from './question-clone.service';

describe('QuestionCloneController', () => {
  let controller: QuestionCloneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionCloneController],
      providers: [QuestionCloneService],
    }).compile();

    controller = module.get<QuestionCloneController>(QuestionCloneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
