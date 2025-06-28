import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MultipeChoiceService } from './multipe-choice.service';
import { CreateMultipeChoiceDto } from './dto/create-multipe-choice.dto';
import { UpdateMultipeChoiceDto } from './dto/update-multipe-choice.dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { MultipeChoice } from './entities/multipe-choice.entity';
import { Public } from 'src/auth/auth.decorator';

@Controller('multipe-choice')
export class MultipeChoiceController {
  constructor(private readonly multipeChoiceService: MultipeChoiceService) {}

  @Post()
  @Public()
  create(@Body() createMultipeChoiceDto: CreateMultipeChoiceDto) {
    return this.multipeChoiceService.create(createMultipeChoiceDto);
  }

  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<MultipeChoice>) {
    return this.multipeChoiceService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.multipeChoiceService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateMultipeChoiceDto: UpdateMultipeChoiceDto) {
    return this.multipeChoiceService.update(+id, updateMultipeChoiceDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.multipeChoiceService.remove(+id);
  }
}
