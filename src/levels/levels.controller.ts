import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Level } from './entities/level.entity';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post()
  @Public()
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelsService.create(createLevelDto);
  }

  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Level>) {
    return this.levelsService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.levelsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.levelsService.update(+id, updateLevelDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.levelsService.remove(+id);
  }
}
