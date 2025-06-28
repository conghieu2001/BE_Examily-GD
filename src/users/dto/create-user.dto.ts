import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
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

}
