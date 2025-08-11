import { Module } from '@nestjs/common';
import { CourseByExamsService } from './course-by-exams.service';
import { CourseByExamsController } from './course-by-exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseByExam } from './entities/course-by-exam.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { Course } from 'src/courses/entities/course.entity';
import { ExamSession } from 'src/exam-session/entities/exam-session.entity';
import { ExamsService } from 'src/exams/exams.service';
import { ExamsModule } from 'src/exams/exams.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseByExam, Exam, Course, ExamSession, User]), ExamsModule],
  controllers: [CourseByExamsController],
  providers: [CourseByExamsService],
  
})
export class CourseByExamsModule {}
