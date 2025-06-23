import { Test, TestingModule } from '@nestjs/testing';
import { CousemembersService } from './coursemembers.service';

describe('CousemembersService', () => {
  let service: CousemembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CousemembersService],
    }).compile();

    service = module.get<CousemembersService>(CousemembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
