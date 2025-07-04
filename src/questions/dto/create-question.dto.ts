import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { CreateAnswerDto } from "src/answers/dto/create-answer.dto";

export class CreateQuestionDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNotEmpty()
    content: string;

    // @ApiProperty()
    // @IsNumber()
    // examId: number;

    @ApiProperty()
    @IsNumber()
    subjectId: number;

    @ApiProperty()
    @IsNumber()
    classId: number;

    @ApiProperty()
    @IsNumber()
    topicId: number;

    @ApiProperty()
    @IsNumber()
    multipleChoiceId: number;

    @ApiProperty()
    @IsNumber()
    levelId: number;

    // @ApiProperty()
    // @IsNumber()
    // score: number;

    @ApiProperty()
    @IsNumber()
    typeQuestionId: number;

    @ApiProperty({ type: [CreateAnswerDto] })
    @IsArray()
    answers: CreateAnswerDto[];
}
