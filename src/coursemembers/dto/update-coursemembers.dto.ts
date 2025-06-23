import { PartialType } from '@nestjs/swagger';
import { CreateCousememberDto } from './create-coursemembers.dto';

export class UpdateCousememberDto extends PartialType(CreateCousememberDto) {}
