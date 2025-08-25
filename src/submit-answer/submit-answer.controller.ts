import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubmitAnswerService } from './submit-answer.service';
import { CreateSubmitAnswerDto } from './dto/create-submit-answer.dto';
import { UpdateSubmitAnswerDto } from './dto/update-submit-answer.dto';

@Controller('submit-answer')
export class SubmitAnswerController {
  constructor(private readonly submitAnswerService: SubmitAnswerService) {}

  @Post()
  create(@Body() createSubmitAnswerDto: CreateSubmitAnswerDto) {
    return this.submitAnswerService.create(createSubmitAnswerDto);
  }

  @Get()
  findAll() {
    return this.submitAnswerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submitAnswerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubmitAnswerDto: UpdateSubmitAnswerDto) {
    return this.submitAnswerService.update(+id, updateSubmitAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.submitAnswerService.remove(+id);
  }
}
