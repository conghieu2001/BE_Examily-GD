import { Module } from '@nestjs/common';
import { CourseByExamsService } from './course-by-exams.service';
import { CourseByExamsController } from './course-by-exams.controller';

@Module({
  controllers: [CourseByExamsController],
  providers: [CourseByExamsService],
})
export class CourseByExamsModule {}
