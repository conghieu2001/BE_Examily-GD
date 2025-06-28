import { PartialType } from '@nestjs/swagger';
import { CreateMultipeChoiceDto } from './create-multipe-choice.dto';

export class UpdateMultipeChoiceDto extends PartialType(CreateMultipeChoiceDto) {}
