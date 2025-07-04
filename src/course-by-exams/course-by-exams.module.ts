import { Module } from '@nestjs/common';
import { CourseByExamsService } from './course-by-exams.service';
import { CourseByExamsController } from './course-by-exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseByExam } from './entities/course-by-exam.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { Course } from 'src/courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseByExam, Exam, Course])],
  controllers: [CourseByExamsController],
  providers: [CourseByExamsService],
})
export class CourseByExamsModule {}
