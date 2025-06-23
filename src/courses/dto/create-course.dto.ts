import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateCourseDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    name: string
    @ApiProperty()
    @IsString()
    description: string
}
