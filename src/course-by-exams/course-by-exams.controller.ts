import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CourseByExamsService } from './course-by-exams.service';
import { CreateCourseByExamDto } from './dto/create-course-by-exam.dto';
import { UpdateCourseByExamDto } from './dto/update-course-by-exam.dto';

@Controller('course-by-exams')
export class CourseByExamsController {
  constructor(private readonly courseByExamsService: CourseByExamsService) {}

  @Post()
  create(@Body() createCourseByExamDto: CreateCourseByExamDto) {
    return this.courseByExamsService.create(createCourseByExamDto);
  }

  @Get()
  findAll() {
    return this.courseByExamsService.findAll();
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
