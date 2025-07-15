import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAnswerDto } from './create-answer.dto';
import { IsInt, IsNumber } from 'class-validator';

export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {
    // @ApiProperty()
    // @IsNumber()
    // answerId: number;
// }
}
