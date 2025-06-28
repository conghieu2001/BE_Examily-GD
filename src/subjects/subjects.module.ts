import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Topic } from 'src/topics/entities/topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class ,Subject, Topic])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
