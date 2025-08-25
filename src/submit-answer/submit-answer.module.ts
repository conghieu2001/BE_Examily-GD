import { Module } from '@nestjs/common';
import { SubmitAnswerService } from './submit-answer.service';
import { SubmitAnswerController } from './submit-answer.controller';

@Module({
  controllers: [SubmitAnswerController],
  providers: [SubmitAnswerService],
})
export class SubmitAnswerModule {}
