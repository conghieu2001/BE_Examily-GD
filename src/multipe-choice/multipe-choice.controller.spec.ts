import { Test, TestingModule } from '@nestjs/testing';
import { MultipeChoiceController } from './multipe-choice.controller';
import { MultipeChoiceService } from './multipe-choice.service';

describe('MultipeChoiceController', () => {
  let controller: MultipeChoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultipeChoiceController],
      providers: [MultipeChoiceService],
    }).compile();

    controller = module.get<MultipeChoiceController>(MultipeChoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
