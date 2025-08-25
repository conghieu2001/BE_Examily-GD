import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { statusExam } from "../entities/course-by-exam.entity";

export class CreateCourseByExamDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    title: string

    @ApiProperty()
    @IsInt()
    examId: number;

    @ApiProperty()
    @IsInt()
    courseId: number;

    // @ApiProperty({default: 0})
    // @IsInt()
    // joincount: number;

    // @ApiProperty()
    // @IsBoolean()
    // isLocked: boolean;

    @ApiProperty({ required: false })
    @ValidateIf(o => o.isLocked)
    @IsString()
    @IsNotEmpty()
    password?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    availableFrom?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    availableTo?: string;

    @IsOptional()
    @IsEnum(statusExam)
    status?: statusExam;
}
