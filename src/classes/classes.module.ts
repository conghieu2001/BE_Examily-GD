import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Subject } from 'rxjs';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Subject])],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule { }
