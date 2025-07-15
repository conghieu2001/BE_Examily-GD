import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsEmail, IsInt, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateUserDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    fullName: string;
    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty()
    @IsOptional()
    isAdmin?: boolean = false;
    // @ApiProperty()
    @IsOptional()
    role: string;

    avatar?: string;

    @ApiProperty({ type: [Number], required: false })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    classIds?: number[];

    @ApiProperty({ type: [Number], required: false })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    subjectIds?: number[];

}
