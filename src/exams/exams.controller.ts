import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Exam } from './entities/exam.entity';
import { Public } from 'src/auth/auth.decorator';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';

@Controller('exams')
@UseGuards(RoleGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) { }

  @Post()
  @Roles(Role.ADMIN && Role.TEACHER)
  create(@Body() createExamDto: CreateExamDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examsService.create(createExamDto, user);
  }
  @Get('origins')
  @Roles(Role.ADMIN && Role.TEACHER)
  findAllByExamReal(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Exam>, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examsService.findAllExamReal(pageOptionDto, query, user,request);
  }
  @Get()
  @Roles(Role.ADMIN && Role.TEACHER)
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Exam>, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examsService.findAll(pageOptionDto, query, user,request);
  }
  
  @Patch('toggle-public/:id')
  @Roles(Role.ADMIN && Role.TEACHER)
  async toggleIsPublic(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request
  ) {
    const user: User = request['user'] ?? null;
    return this.examsService.toggleIsPublic(id, user);
  }
  @Post('clone/:id')
  @Roles(Role.ADMIN && Role.TEACHER)
  async cloneExam(
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const user = req['user'];
    return await this.examsService.clone(+id, user);
  }
  @Get(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  findOne(@Param('id') id: string, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examsService.findOne(+id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  // @Public()
  update(
    @Param('id') id: string,
    @Body() rawBody: any, // KHÔNG dùng DTO ở đây
    @Req() request: Request
  ) {
    const user: User = request['user'] ?? null;
    const rawQuestionClones = rawBody.questionClones ?? [];
    // console.log(rawQuestionClones)
    return this.examsService.update(+id, rawBody, user, rawQuestionClones);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.examsService.remove(+id);
  }
}
