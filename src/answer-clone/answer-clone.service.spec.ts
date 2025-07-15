import { Test, TestingModule } from '@nestjs/testing';
import { AnswerCloneService } from './answer-clone.service';

describe('AnswerCloneService', () => {
  let service: AnswerCloneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnswerCloneService],
    }).compile();

    service = module.get<AnswerCloneService>(AnswerCloneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
