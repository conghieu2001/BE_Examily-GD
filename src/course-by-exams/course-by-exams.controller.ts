import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
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
  @Roles(Role.ADMIN && Role.TEACHER)
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<CourseByExam>) {
    return this.courseByExamsService.findAll(pageOptionDto, query);
  }
  @Patch('change-password/:id')
  @Roles(Role.ADMIN && Role.TEACHER)
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    return this.courseByExamsService.changeCourseByExamPassword(id, dto.oldPassword, dto.newPassword);
  }
  @Patch(':courseByExamId/students/:studentId')
  @Roles(Role.ADMIN && Role.TEACHER)
  removeStudent(
    @Param('courseByExamId') courseByExamId: number,
    @Param('studentId') studentId: number,
  ) {
    return this.courseByExamsService.removeStudent(courseByExamId, studentId);
  }

  @Post('start/:id')
  @Roles( Role.TEACHER, Role.STUDENT)
  async getOrStartExamSession(
    @Param('id') id: number,
    @Body('password') password: string,
    @Req() request: Request) {
    const user: User = request['user'] ?? null;
    // console.log(typeof(password))
    return await this.courseByExamsService.getOrStartExamSession(+id, user, password);
  }

  // @Patch(':id/join')
  // @Roles(Role.ADMIN && Role.TEACHER)
  // async joinCourseByExam(
  //   @Param('id') id: number,
  //   @Body() dto: JoinCourseByExamDto,
  //   @Req() request: Request
  // ) {
  //   const user: User = request['user'] ?? null;
  //   return this.courseByExamsService.joinCourseByExam(id, user, dto);
  // }
  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(@Param('id') id: string, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.courseByExamsService.findOne(+id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  update(@Param('id') id: string, @Body() updateCourseByExamDto: UpdateCourseByExamDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.courseByExamsService.update(+id, updateCourseByExamDto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  remove(@Param('id') id: string) {
    return this.courseByExamsService.remove(+id);
  }
}
