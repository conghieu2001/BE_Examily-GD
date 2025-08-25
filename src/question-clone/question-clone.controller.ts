import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { QuestionCloneService } from './question-clone.service';
import { CreateQuestionCloneDto } from './dto/create-question-clone.dto';
import { UpdateQuestionCloneDto } from './dto/update-question-clone.dto';
import { User } from 'src/users/entities/user.entity';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { QuestionClone } from './entities/question-clone.entity';
import { Public } from 'src/auth/auth.decorator';

@Controller('question-clone')
@UseGuards(RoleGuard)
export class QuestionCloneController {
  constructor(private readonly questionCloneService: QuestionCloneService) { }

  @Post()
  @Roles(Role.ADMIN && Role.TEACHER)
  create(@Body() createQuestionCloneDto: CreateQuestionCloneDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.questionCloneService.create(createQuestionCloneDto, user);
  }

  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<QuestionClone>) {
    return this.questionCloneService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionCloneService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  update(@Param('id') id: string, @Body() updateQuestionCloneDto: UpdateQuestionCloneDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.questionCloneService.update(+id, updateQuestionCloneDto, user);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.questionCloneService.remove(+id);
  // }
}
