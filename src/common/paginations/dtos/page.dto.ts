import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { PageMetaDto } from './page.metadata.dto';

export class PageDto<T> {
    @IsArray()
    @ApiProperty({ isArray: true })
    readonly result: T[];

    @ApiProperty({ type: () => PageMetaDto })
    readonly meta: PageMetaDto;

    constructor(data: T[], meta: PageMetaDto) {
        this.result = data;
        this.meta = meta;
    }
}


export class ItemDto<T> {
    @IsArray()
    @ApiProperty()
    readonly result: T;


    constructor(data: T) {
        this.result = data;
    }
}
