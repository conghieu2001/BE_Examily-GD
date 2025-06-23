import { Module } from '@nestjs/common';
import { RoleInGroupService } from './role_in_group.service';
import { RoleInGroupController } from './role_in_group.controller';

@Module({
  controllers: [RoleInGroupController],
  providers: [RoleInGroupService],
})
export class RoleInGroupModule {}
