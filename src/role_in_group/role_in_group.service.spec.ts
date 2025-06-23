import { Test, TestingModule } from '@nestjs/testing';
import { RoleInGroupService } from './role_in_group.service';

describe('RoleInGroupService', () => {
  let service: RoleInGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleInGroupService],
    }).compile();

    service = module.get<RoleInGroupService>(RoleInGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
