import { Module } from '@nestjs/common';
import { TypeQuestionsService } from './type-questions.service';
import { TypeQuestionsController } from './type-questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeQuestion } from './entities/type-question.entity';

@Module({
  imports:[TypeOrmModule.forFeature([TypeQuestion])],
  controllers: [TypeQuestionsController],
  providers: [TypeQuestionsService],
})
export class TypeQuestionsModule {}
