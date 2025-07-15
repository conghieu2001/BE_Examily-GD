import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuestionScoreService } from './question-score.service';
import { CreateQuestionScoreDto } from './dto/create-question-score.dto';
import { UpdateQuestionScoreDto } from './dto/update-question-score.dto';
import { Public } from 'src/auth/auth.decorator';

@Controller('question-score')
export class QuestionScoreController {
  constructor(private readonly questionScoreService: QuestionScoreService) {}

  @Post()
  @Public()
  create(@Body() createQuestionScoreDto: CreateQuestionScoreDto) {
    return this.questionScoreService.create(createQuestionScoreDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.questionScoreService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.questionScoreService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateQuestionScoreDto: UpdateQuestionScoreDto) {
    return this.questionScoreService.update(+id, updateQuestionScoreDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.questionScoreService.remove(+id);
  }
}
