import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Exam } from './entities/exam.entity';
import { Public } from 'src/auth/auth.decorator';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) { }

  @Post()
  @Public()
  create(@Body() createExamDto: CreateExamDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examsService.create(createExamDto, user);
  }

  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Exam>) {
    return this.examsService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(+id, updateExamDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.examsService.remove(+id);
  }
}
