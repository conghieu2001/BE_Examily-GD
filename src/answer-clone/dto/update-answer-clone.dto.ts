import { PartialType } from '@nestjs/swagger';
import { CreateAnswerCloneDto } from './create-answer-clone.dto';

export class UpdateAnswerCloneDto extends PartialType(CreateAnswerCloneDto) {}
