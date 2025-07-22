import { forwardRef, Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { Topic } from 'src/topics/entities/topic.entity';
import { Level } from 'src/levels/entities/level.entity';
import { AnswersModule } from 'src/answers/answers.module';
import { Class } from 'src/classes/entities/class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { MultipeChoice } from 'src/multipe-choice/entities/multipe-choice.entity';
import { Answer } from 'src/answers/entities/answer.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Exam, Topic, Level, Subject, Class, TypeQuestion, MultipeChoice, Answer, User]),  forwardRef(() => AnswersModule),],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
