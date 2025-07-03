import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
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
    @IsInt()
    @IsNotEmpty()
    courseId: number;
    @ApiProperty({ type: [Number]})
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    questionIds?: number[];
}
