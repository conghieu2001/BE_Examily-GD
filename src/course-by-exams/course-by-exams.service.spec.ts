import { Test, TestingModule } from '@nestjs/testing';
import { CourseByExamsService } from './course-by-exams.service';

describe('CourseByExamsService', () => {
  let service: CourseByExamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CourseByExamsService],
    }).compile();

    service = module.get<CourseByExamsService>(CourseByExamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
