import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';

@Controller('exam-session')
export class ExamSessionController {
  constructor(private readonly examSessionService: ExamSessionService) {}

  @Post()
  create(@Body() createExamSessionDto: CreateExamSessionDto) {
    return this.examSessionService.create(createExamSessionDto);
  }

  @Get()
  findAll() {
    return this.examSessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examSessionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamSessionDto: UpdateExamSessionDto) {
    return this.examSessionService.update(+id, updateExamSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examSessionService.remove(+id);
  }
}
