import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { MultipeChoiceType } from "../entities/multipe-choice.entity";

export class CreateMultipeChoiceDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;
    @ApiProperty()
    @IsEnum(MultipeChoiceType)
    type: MultipeChoiceType
}
