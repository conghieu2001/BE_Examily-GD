import { Module } from '@nestjs/common';
import { GroupmembersService } from './groupmembers.service';
import { GroupmembersController } from './groupmembers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Groupmember } from './entities/groupmember.entity';
import { Group } from 'src/groups/entities/group.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Groupmember, Group, User])],
  controllers: [GroupmembersController],
  providers: [GroupmembersService],
})
export class GroupmembersModule {}
