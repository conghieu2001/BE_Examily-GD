import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateClassDto extends OmitType(BaseDto, [] as const) {
    // @ApiProperty()
    // @IsNotEmpty()
    // name: string;
}
