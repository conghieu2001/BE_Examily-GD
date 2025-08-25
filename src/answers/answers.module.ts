import { Module, forwardRef } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { Question } from 'src/questions/entities/question.entity';
import { QuestionsModule } from 'src/questions/questions.module'; // ✅ import module gốc

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer, Question]),
    forwardRef(() => QuestionsModule),
  ],
  controllers: [AnswersController],
  providers: [AnswersService],
  exports: [AnswersService], // ✅ export service cho module khác dùng
})
export class AnswersModule {}
