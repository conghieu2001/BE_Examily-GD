import { PartialType } from '@nestjs/swagger';
import { CreateQuestionCloneDto } from './create-question-clone.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateQuestionCloneDto extends PartialType(CreateQuestionCloneDto) {
    @IsOptional()
  @IsNumber()
  id?: number;
}
