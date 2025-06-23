import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateCousememberDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNotEmpty()
    courseId: number;
    @ApiProperty()
    @IsNotEmpty()
    userId: number;
    // @ApiProperty()
    // @IsOptional()
    // @IsString()
    // role_in_course?: string = 'member';
}
