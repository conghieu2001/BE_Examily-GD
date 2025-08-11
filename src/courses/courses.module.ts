import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from 'src/exams/entities/exam.entity';
import { Course } from './entities/course.entity';
import { CourseByExam } from 'src/course-by-exams/entities/course-by-exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Exam, CourseByExam])],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
