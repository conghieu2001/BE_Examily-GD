import { Injectable } from '@nestjs/common';
import { CreateGroupmemberDto } from './dto/create-groupmember.dto';
import { UpdateGroupmemberDto } from './dto/update-groupmember.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Groupmember } from './entities/groupmember.entity';
import { Repository } from 'typeorm';
import { Group } from 'src/groups/entities/group.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class GroupmembersService {
  constructor(
    @InjectRepository(Groupmember) private groupmemberRepo: Repository<Groupmember>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ){}
  create(createGroupmemberDto: CreateGroupmemberDto) {
    return 'This action adds a new groupmember';
  }

  findAll() {
    return `This action returns all groupmembers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupmember`;
  }

  update(id: number, updateGroupmemberDto: UpdateGroupmemberDto) {
    return `This action updates a #${id} groupmember`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupmember`;
  }
}
