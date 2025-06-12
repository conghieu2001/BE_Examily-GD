import { PartialType } from '@nestjs/swagger';
import { CreateGroupmemberDto } from './create-groupmember.dto';

export class UpdateGroupmemberDto extends PartialType(CreateGroupmemberDto) {}
