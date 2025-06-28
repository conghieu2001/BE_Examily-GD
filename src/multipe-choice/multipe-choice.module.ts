import { Module } from '@nestjs/common';
import { MultipeChoiceService } from './multipe-choice.service';
import { MultipeChoiceController } from './multipe-choice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultipeChoice } from './entities/multipe-choice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MultipeChoice])],
  controllers: [MultipeChoiceController],
  providers: [MultipeChoiceService],
})
export class MultipeChoiceModule {}
