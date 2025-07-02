import { Module } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forFeature([Question, Exam, Topic, Level, Subject, Class, TypeQuestion]), AnswersModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
