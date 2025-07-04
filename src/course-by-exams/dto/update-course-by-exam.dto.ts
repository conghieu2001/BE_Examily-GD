import { PartialType } from '@nestjs/swagger';
import { CreateCourseByExamDto } from './create-course-by-exam.dto';

export class UpdateCourseByExamDto extends PartialType(CreateCourseByExamDto) {}
