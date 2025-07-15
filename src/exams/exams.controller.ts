import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
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
    // console.log(user)
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

  @Post('clone/:id')
  @Roles(Role.ADMIN && Role.TEACHER)
  async cloneExam(
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const user = req['user'];
    return await this.examsService.clone(+id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examsService.update(+id, updateExamDto, user);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.examsService.remove(+id);
  }
}
