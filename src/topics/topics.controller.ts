import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Topic } from './entities/topic.entity';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) { }

  @Post()
  @Public()
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  @Public()
  findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @Query() query: Partial<Topic>,
  ) {
    return this.topicsService.findAll(pageOptionsDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(+id, updateTopicDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.topicsService.remove(+id);
  }
}
