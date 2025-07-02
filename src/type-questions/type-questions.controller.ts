import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TypeQuestionsService } from './type-questions.service';
import { CreateTypeQuestionDto } from './dto/create-type-question.dto';
import { UpdateTypeQuestionDto } from './dto/update-type-question.dto';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { TypeQuestion } from './entities/type-question.entity';

@Controller('type-questions')
@Public()
export class TypeQuestionsController {
  constructor(private readonly typeQuestionsService: TypeQuestionsService) {}

  @Post()
  create(@Body() createTypeQuestionDto: CreateTypeQuestionDto) {
    return this.typeQuestionsService.create(createTypeQuestionDto);
  }

  @Get()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<TypeQuestion>) {
    return this.typeQuestionsService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeQuestionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeQuestionDto: UpdateTypeQuestionDto) {
    return this.typeQuestionsService.update(+id, updateTypeQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeQuestionsService.remove(+id);
  }
}
