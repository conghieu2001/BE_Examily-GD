import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateTypeQuestionDto {
    @ApiProperty()
    @IsString()
    name: string;
}
