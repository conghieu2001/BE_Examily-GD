import { Module } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service';
import { ExamSessionController } from './exam-session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSession } from './entities/exam-session.entity';
import { CourseByExam } from 'src/course-by-exams/entities/course-by-exam.entity';
import { SubmitAnswer } from 'src/submit-answer/entities/submit-answer.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { User } from 'src/users/entities/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([ExamSession, CourseByExam, SubmitAnswer, QuestionClone, User])],
  controllers: [ExamSessionController],
  providers: [ExamSessionService],
})
export class ExamSessionModule {}
