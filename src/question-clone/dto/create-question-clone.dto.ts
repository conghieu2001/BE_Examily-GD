import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { CreateAnswerCloneDto } from "src/answer-clone/dto/create-answer-clone.dto";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateQuestionCloneDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNotEmpty()
    content: string;

    @ApiProperty()
    @IsNumber()
    typeQuestionId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    answerclones: CreateAnswerCloneDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    multipleChoiceId?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    score: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    topicId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    levelId?: number;
}
