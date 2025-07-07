import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Put } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { RoleGuard } from 'src/roles/role.guard';
import { Public } from 'src/auth/auth.decorator';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Answer } from './entities/answer.entity';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';

@Controller('answers')
@UseGuards(RoleGuard)
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  @Roles(Role.TEACHER)
  create(@Body() createAnswerDto: CreateAnswerDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.answersService.create(createAnswerDto, user);
  }

  @Get()
  @Roles(Role.TEACHER)
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Answer>, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.answersService.findAll(pageOptionDto, query, user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.answersService.findOne(+id);
  }

  @Patch(':id')
  // @Roles(Role.TEACHER)
  @Public()
  update(@Param('id') id: string, @Body() updateAnswerDto: UpdateAnswerDto) {
    return this.answersService.update(+id, updateAnswerDto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  remove(@Param('id') id: string, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.answersService.remove(+id, user);
  }
}
