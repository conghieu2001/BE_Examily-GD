import { Test, TestingModule } from '@nestjs/testing';
import { RoleInGroupController } from './role_in_group.controller';
import { RoleInGroupService } from './role_in_group.service';

describe('RoleInGroupController', () => {
  let controller: RoleInGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleInGroupController],
      providers: [RoleInGroupService],
    }).compile();

    controller = module.get<RoleInGroupController>(RoleInGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
