import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateExamSessionDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    courseByExamId: number;
}
