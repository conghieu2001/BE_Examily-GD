import { Test, TestingModule } from '@nestjs/testing';
import { ExamSessionService } from './exam-session.service';

describe('ExamSessionService', () => {
  let service: ExamSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamSessionService],
    }).compile();

    service = module.get<ExamSessionService>(ExamSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
