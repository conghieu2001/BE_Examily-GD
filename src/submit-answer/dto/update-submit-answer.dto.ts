import { PartialType } from '@nestjs/swagger';
import { CreateSubmitAnswerDto } from './create-submit-answer.dto';

export class UpdateSubmitAnswerDto extends PartialType(CreateSubmitAnswerDto) {}
