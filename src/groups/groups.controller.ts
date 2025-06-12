import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Public } from 'src/auth/auth.decorator';
import { User } from 'src/users/entities/user.entity';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Group } from './entities/group.entity';

@Controller('groups')
@UseGuards(RoleGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(Role.ADMIN && Role.TEACHER)
  create(@Body() createGroupDto: CreateGroupDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.groupsService.create(createGroupDto, user);
  }

  @Get()
  @Public()
  async findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Group>) {
    return this.groupsService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }
}
