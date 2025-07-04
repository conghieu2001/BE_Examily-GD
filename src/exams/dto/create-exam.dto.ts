import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateExamDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    description?: string;
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    durationMinutes: number;
    @ApiProperty()
    @IsNumber()
    totalMultipleChoiceScore: number;
    @ApiProperty()
    @IsNumber()
    totalMultipleChoiceScorePartI: number;
    @ApiProperty()
    @IsNumber()
    totalMultipleChoiceScorePartII: number;
    @ApiProperty()
    @IsNumber()
    totalMultipleChoiceScorePartIII: number;
    @ApiProperty()
    @IsNumber()
    totalEssayScore: number;
    // @ApiProperty()
    // @IsInt()
    // @IsNotEmpty()
    // courseId: number;
    @ApiProperty({ type: [Number]})
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    questionIds?: number[];
}
