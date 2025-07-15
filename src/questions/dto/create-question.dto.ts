import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { CreateAnswerDto } from "src/answers/dto/create-answer.dto";
import { Answer } from "src/answers/entities/answer.entity";

export class CreateQuestionDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    subjectId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    classId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    topicId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    multipleChoiceId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    levelId: number;

    @ApiProperty()
    @IsNumber()
    typeQuestionId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    answers: CreateAnswerDto[];
}
