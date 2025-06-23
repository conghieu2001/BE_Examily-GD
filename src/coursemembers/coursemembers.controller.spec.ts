import { Test, TestingModule } from '@nestjs/testing';
import { CousemembersController } from './coursemembers.controller';
import { CousemembersService } from './coursemembers.service';

describe('CousemembersController', () => {
  let controller: CousemembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CousemembersController],
      providers: [CousemembersService],
    }).compile();

    controller = module.get<CousemembersController>(CousemembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
