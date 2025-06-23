import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { QuestionType } from "../entities/question.entity";

export class CreateQuestionDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNotEmpty()
    content: string;
    @ApiProperty()
    @IsEnum(QuestionType)
    type: QuestionType;
    @ApiProperty()
    @IsNumber()
    examId: number;
}
