import { forwardRef, Module } from '@nestjs/common';
import { QuestionCloneService } from './question-clone.service';
import { QuestionCloneController } from './question-clone.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionClone } from './entities/question-clone.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { AnswerClone } from 'src/answer-clone/entities/answer-clone.entity';
import { MultipeChoice } from 'src/multipe-choice/entities/multipe-choice.entity';
import { AnswerCloneModule } from 'src/answer-clone/answer-clone.module';
import { Topic } from 'src/topics/entities/topic.entity';
import { Level } from 'src/levels/entities/level.entity';
import { Exam } from 'src/exams/entities/exam.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionClone, TypeQuestion, AnswerClone, MultipeChoice, Topic, Level, Exam]),
    forwardRef(() => AnswerCloneModule),
  ],
  controllers: [QuestionCloneController],
  providers: [QuestionCloneService],
  exports: [QuestionCloneService],
})
export class QuestionCloneModule { }
