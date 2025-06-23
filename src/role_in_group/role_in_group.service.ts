import { Injectable } from '@nestjs/common';
import { CreateRoleInGroupDto } from './dto/create-role_in_group.dto';
import { UpdateRoleInGroupDto } from './dto/update-role_in_group.dto';

@Injectable()
export class RoleInGroupService {
  create(createRoleInGroupDto: CreateRoleInGroupDto) {
    return 'This action adds a new roleInGroup';
  }

  findAll() {
    return `This action returns all roleInGroup`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roleInGroup`;
  }

  update(id: number, updateRoleInGroupDto: UpdateRoleInGroupDto) {
    return `This action updates a #${id} roleInGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} roleInGroup`;
  }
}
