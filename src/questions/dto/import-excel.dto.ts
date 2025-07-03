import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class ImportExcelQuestion extends OmitType(BaseDto, [] as const) {
    @ApiProperty({
        type: 'string',
        format: 'binary',
    })
    file: any;
    
}
