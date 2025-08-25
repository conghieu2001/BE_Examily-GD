import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Subject } from './entities/subject.entity';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) { }

  @Post()
  @Public()
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }
  @Get()
  @Public()
  findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @Query() query: Partial<Subject>,
  ) {
    return this.subjectsService.findAll(pageOptionsDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(+id, updateSubjectDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(+id);
  }
}
