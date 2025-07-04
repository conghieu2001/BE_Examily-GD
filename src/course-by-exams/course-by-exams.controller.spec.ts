import { Test, TestingModule } from '@nestjs/testing';
import { CourseByExamsController } from './course-by-exams.controller';
import { CourseByExamsService } from './course-by-exams.service';

describe('CourseByExamsController', () => {
  let controller: CourseByExamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseByExamsController],
      providers: [CourseByExamsService],
    }).compile();

    controller = module.get<CourseByExamsController>(CourseByExamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
