import { Injectable } from '@nestjs/common';
import { CreateCourseByExamDto } from './dto/create-course-by-exam.dto';
import { UpdateCourseByExamDto } from './dto/update-course-by-exam.dto';

@Injectable()
export class CourseByExamsService {
  create(createCourseByExamDto: CreateCourseByExamDto) {
    return 'This action adds a new courseByExam';
  }

  findAll() {
    return `This action returns all courseByExams`;
  }

  findOne(id: number) {
    return `This action returns a #${id} courseByExam`;
  }

  update(id: number, updateCourseByExamDto: UpdateCourseByExamDto) {
    return `This action updates a #${id} courseByExam`;
  }

  remove(id: number) {
    return `This action removes a #${id} courseByExam`;
  }
}
