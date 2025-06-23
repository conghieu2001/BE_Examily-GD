import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoleInGroupService } from './role_in_group.service';
import { CreateRoleInGroupDto } from './dto/create-role_in_group.dto';
import { UpdateRoleInGroupDto } from './dto/update-role_in_group.dto';

@Controller('role-in-group')
export class RoleInGroupController {
  constructor(private readonly roleInGroupService: RoleInGroupService) {}

  @Post()
  create(@Body() createRoleInGroupDto: CreateRoleInGroupDto) {
    return this.roleInGroupService.create(createRoleInGroupDto);
  }

  @Get()
  findAll() {
    return this.roleInGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleInGroupService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleInGroupDto: UpdateRoleInGroupDto) {
    return this.roleInGroupService.update(+id, updateRoleInGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleInGroupService.remove(+id);
  }
}
