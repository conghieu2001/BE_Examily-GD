import { Test, TestingModule } from '@nestjs/testing';
import { SubmitAnswerController } from './submit-answer.controller';
import { SubmitAnswerService } from './submit-answer.service';

describe('SubmitAnswerController', () => {
  let controller: SubmitAnswerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmitAnswerController],
      providers: [SubmitAnswerService],
    }).compile();

    controller = module.get<SubmitAnswerController>(SubmitAnswerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
