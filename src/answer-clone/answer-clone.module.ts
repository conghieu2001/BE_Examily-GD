import { forwardRef, Module } from '@nestjs/common';
import { AnswerCloneService } from './answer-clone.service';
import { AnswerCloneController } from './answer-clone.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerClone } from './entities/answer-clone.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { QuestionCloneModule } from 'src/question-clone/question-clone.module';

@Module({
  imports: [
      TypeOrmModule.forFeature([AnswerClone, QuestionClone]),
      forwardRef(() => QuestionCloneModule),
    ],
  controllers: [AnswerCloneController],
  providers: [AnswerCloneService],
  exports: [AnswerCloneService], 
})
export class AnswerCloneModule {}
