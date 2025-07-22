import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { User } from 'src/users/entities/user.entity';
import { Question } from 'src/questions/entities/question.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { QuestionScore } from 'src/question-score/entities/question-score.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { QuestionCloneModule } from 'src/question-clone/question-clone.module';
import { AnswerClone } from 'src/answer-clone/entities/answer-clone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, Course, User, Question, Class, Subject, QuestionScore, TypeQuestion, QuestionClone, AnswerClone]), QuestionCloneModule],
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}
