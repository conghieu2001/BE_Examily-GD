import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './entities/topic.entity';
import { Subject } from 'src/subjects/entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Topic, Subject])],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
