import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { CreateQuestionCloneDto } from "src/question-clone/dto/create-question-clone.dto";

export class example {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  questionId?: number;
  @ApiProperty({ description: 'Nội dung câu hỏi tự luận' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Điểm số của câu hỏi tự luận' })
  @IsNumber()
  score: number;
}

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

  // @ApiProperty({ type: [Number], required: false })
  // @IsOptional()
  // @IsArray()
  // @IsInt({ each: true })
  // questionIds?: number[];
  @ApiProperty({ type: [CreateQuestionCloneDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionCloneDto)
  questionClones?: CreateQuestionCloneDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  subjectId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  classId?: number;

  @ApiProperty({ type: [example], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => example)
  questionScores?: example[];
}
