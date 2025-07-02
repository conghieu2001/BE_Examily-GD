import { Test, TestingModule } from '@nestjs/testing';
import { TypeQuestionsService } from './type-questions.service';

describe('TypeQuestionsService', () => {
  let service: TypeQuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeQuestionsService],
    }).compile();

    service = module.get<TypeQuestionsService>(TypeQuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
