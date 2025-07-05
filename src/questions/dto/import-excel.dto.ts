import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsEmail, IsNumber, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class ImportExcelQuestion extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsNumber()
    subjectId: number;

    @ApiProperty()
    @IsNumber()
    classId: number;

    // @ApiProperty()
    // @IsNumber()
    // topicId: number;

    // @ApiProperty()
    // @IsNumber()
    // multipleChoiceId: number;

    @ApiProperty()
    @IsNumber()
    typeQuestionId: number;
    @ApiProperty({
        type: 'string',
        format: 'binary',
    })
    file: any;
}
