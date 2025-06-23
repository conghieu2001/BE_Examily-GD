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

@Controller('courses')
@UseGuards(RoleGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

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

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
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
