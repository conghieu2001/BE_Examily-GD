import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateCourseDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    name: string
    @ApiProperty()
    @IsString()
    description: string

    // @ApiProperty()
    // @IsBoolean()
    // isLocked: boolean;

    @ApiProperty()
    // @ValidateIf(o => o.isLocked === true)
    @IsOptional()
    @IsString()
    // @IsNotEmpty()
    password?: string;
}
