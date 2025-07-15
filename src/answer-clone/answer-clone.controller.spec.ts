import { Test, TestingModule } from '@nestjs/testing';
import { AnswerCloneController } from './answer-clone.controller';
import { AnswerCloneService } from './answer-clone.service';

describe('AnswerCloneController', () => {
  let controller: AnswerCloneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswerCloneController],
      providers: [AnswerCloneService],
    }).compile();

    controller = module.get<AnswerCloneController>(AnswerCloneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
