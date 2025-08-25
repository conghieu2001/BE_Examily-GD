import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateQuestionScoreDto {
    @ApiProperty()
    @IsNumber()
    examId: number;

    @ApiProperty()
    @IsNumber()
    questionId: number;

    @ApiProperty()
    @IsNumber()
    score: number;
}
