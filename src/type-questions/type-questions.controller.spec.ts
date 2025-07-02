import { Test, TestingModule } from '@nestjs/testing';
import { TypeQuestionsController } from './type-questions.controller';
import { TypeQuestionsService } from './type-questions.service';

describe('TypeQuestionsController', () => {
  let controller: TypeQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeQuestionsController],
      providers: [TypeQuestionsService],
    }).compile();

    controller = module.get<TypeQuestionsController>(TypeQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
