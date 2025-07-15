import { PartialType } from '@nestjs/swagger';
import { CreateQuestionScoreDto } from './create-question-score.dto';

export class UpdateQuestionScoreDto extends PartialType(CreateQuestionScoreDto) {}
