import { Module } from '@nestjs/common';
import { QuestionScoreService } from './question-score.service';
import { QuestionScoreController } from './question-score.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/questions/entities/question.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { QuestionScore } from './entities/question-score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Exam, QuestionScore])],
  controllers: [QuestionScoreController],
  providers: [QuestionScoreService],
})
export class QuestionScoreModule {}
