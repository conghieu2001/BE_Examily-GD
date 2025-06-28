import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateMultipeChoiceDto extends OmitType(BaseDto, [] as const){
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;}
