import { PartialType } from '@nestjs/swagger';
import { CreateQuestionCloneDto } from './create-question-clone.dto';

export class UpdateQuestionCloneDto extends PartialType(CreateQuestionCloneDto) {}
