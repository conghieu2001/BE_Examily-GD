import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from 'src/users/entities/user.entity';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Course } from './entities/course.entity';
import { Public } from 'src/auth/auth.decorator';
import { JoinCourseDto } from './dto/join-course.dto';

@Controller('courses')
@UseGuards(RoleGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @Post()
  @Roles(Role.ADMIN && Role.TEACHER)
  create(@Body() createCourseDto: CreateCourseDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.coursesService.create(createCourseDto, user);
  }

  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Course>) {
    return this.coursesService.findAll(pageOptionDto, query);
  }

  // @Post(':id/join')
  // @Public()
  // async joinCourse(
  //   @Param('id') id: number,
  //   @Req() request: Request,
  //   @Body() dto: JoinCourseDto,
  // ) {
  //   const user: User = request['user'] ?? null;
  //   return this.coursesService.joinCourse(id, user, dto);
  // }

  // @Delete(':courseId/remove-user/:userId')
  // @Roles(Role.ADMIN && Role.TEACHER)
  // async removeStudent(
  //   @Param('courseId') courseId: number,
  //   @Param('userId') userId: number,
  // ) {
  //   return this.coursesService.removeUserFromCourse(courseId, userId);
  // }

  @Get(':id')
  @Roles(Role.ADMIN && Role.TEACHER)
  findOne(@Param('id') id: string, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.coursesService.findOne(+id, user);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }
}
