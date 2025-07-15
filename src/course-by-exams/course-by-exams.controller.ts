import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { CourseByExamsService } from './course-by-exams.service';
import { CreateCourseByExamDto } from './dto/create-course-by-exam.dto';
import { UpdateCourseByExamDto } from './dto/update-course-by-exam.dto';
import { User } from 'src/users/entities/user.entity';
import { CourseByExam } from './entities/course-by-exam.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Public } from 'src/auth/auth.decorator';
import { JoinCourseByExamDto } from './dto/join-course.dto';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';

@Controller('course-by-exams')
@UseGuards(RoleGuard)
export class CourseByExamsController {
  constructor(private readonly courseByExamsService: CourseByExamsService) { }

  @Post()
  @Roles(Role.ADMIN && Role.TEACHER)
  create(@Body() createCourseByExamDto: CreateCourseByExamDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.courseByExamsService.create(createCourseByExamDto, user);
  }

  @Get()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<CourseByExam>) {
    return this.courseByExamsService.findAll(pageOptionDto, query);
  }

  @Patch(':courseByExamId/students/:studentId')
  @Public()
  removeStudent(
    @Param('courseByExamId') courseByExamId: number,
    @Param('studentId') studentId: number,
  ) {
    return this.courseByExamsService.removeStudent(courseByExamId, studentId);
  }
  @Patch(':id/join')
  async joinCourseByExam(
    @Param('id') id: number,
    @Body() dto: JoinCourseByExamDto,
    @Req() request: Request
  ) {
    const user: User = request['user'] ?? null;
    return this.courseByExamsService.joinCourseByExam(id, user, dto);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseByExamsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseByExamDto: UpdateCourseByExamDto) {
    return this.courseByExamsService.update(+id, updateCourseByExamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseByExamsService.remove(+id);
  }
}
