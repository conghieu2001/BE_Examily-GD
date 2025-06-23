import { PartialType } from '@nestjs/swagger';
import { CreateRoleInGroupDto } from './create-role_in_group.dto';

export class UpdateRoleInGroupDto extends PartialType(CreateRoleInGroupDto) {}
