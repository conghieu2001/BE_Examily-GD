import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseByExamDto } from './dto/create-course-by-exam.dto';
import { UpdateCourseByExamDto } from './dto/update-course-by-exam.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseByExam, statusExam } from './entities/course-by-exam.entity';
import { User } from 'src/users/entities/user.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { Course } from 'src/courses/entities/course.entity';
import * as bcrypt from 'bcrypt';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { JoinCourseByExamDto } from './dto/join-course.dto';

@Injectable()
export class CourseByExamsService {
  constructor(
    @InjectRepository(CourseByExam) private coursebyexamRepo: Repository<CourseByExam>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) { }
  async create(createCourseByExamDto: CreateCourseByExamDto, user: User): Promise<CourseByExam> {
    const { examId, courseId, isLocked, password, availableFrom, availableTo } = createCourseByExamDto
    const exam = await this.examRepo.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Không tìm thấy đề thi gốc với ID: ${examId}`);
    }
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }
    if (isLocked && !password) {
      throw new BadRequestException('Vui lòng nhập mật khẩu cho đề thi bị khóa');
    }
    let hashedPassword: string | undefined;
    if (isLocked && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const now = new Date();
    let computedStatus: statusExam = statusExam.NOTSTARTED;

    const from = availableFrom ? new Date(availableFrom) : undefined;
    const to = availableTo ? new Date(availableTo) : undefined;

    if (from && from <= now && (!to || to > now)) {
      computedStatus = statusExam.ONGOING;
    }
    if (to && to <= now) {
      computedStatus = statusExam.ENDED;
    }

    const newEntry = this.coursebyexamRepo.create({
      exam,
      course,
      isLocked,
      password: hashedPassword,
      status: computedStatus,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableTo: availableTo ? new Date(availableTo) : undefined,
      createdBy: user?.isAdmin ? user : null,
    });

    return await this.coursebyexamRepo.save(newEntry);
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<CourseByExam>,
  ): Promise<PageDto<CourseByExam>> {
    const queryBuilder = this.coursebyexamRepo.createQueryBuilder('courseByExam')
      .leftJoinAndSelect('courseByExam.course', 'course')
      .leftJoinAndSelect('courseByExam.exam', 'exam');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường cụ thể (ngoài pagination)
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`courseByExam.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo title
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(courseByExam.title)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    // Sắp xếp, phân trang
    queryBuilder.orderBy('courseByExam.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }
  async findOne(id: number): Promise<ItemDto<CourseByExam>> {
    const courseByExam = await this.coursebyexamRepo.findOne({
      where: { id },
      relations: ['exam', 'course', 'createdBy', 'students'],
    });

    if (!courseByExam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }

    return new ItemDto(courseByExam);
  }
  async update(
    id: number,
    dto: UpdateCourseByExamDto,
  ): Promise<CourseByExam> {
    const exam = await this.coursebyexamRepo.findOne({
      where: { id },
      relations: ['exam', 'course', 'createdBy', 'students'],
    });

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy CourseByExam với ID: ${id}`);
    }

    const {
      title,
      isLocked,
      password,
      availableFrom,
      availableTo,
      examId,
      courseId,
    } = dto;

    if (title !== undefined) exam.title = title;
    if (isLocked !== undefined) exam.isLocked = isLocked;
    if (availableFrom !== undefined) exam.availableFrom = new Date(availableFrom);
    if (availableTo !== undefined) exam.availableTo = new Date(availableTo);

    if (isLocked && password) {
      const bcrypt = await import('bcrypt');
      exam.password = await bcrypt.hash(password, 10);
    }

    if (examId && exam.exam.id !== examId) {
      const newExam = await this.examRepo.findOne({ where: { id: examId } });
      if (!newExam) {
        throw new NotFoundException(`Exam với ID ${examId} không tồn tại`);
      }
      exam.exam = newExam;
    }

    if (courseId && exam.course.id !== courseId) {
      const newCourse = await this.courseRepo.findOne({ where: { id: courseId } });
      if (!newCourse) {
        throw new NotFoundException(`Course với ID ${courseId} không tồn tại`);
      }
      exam.course = newCourse;
    }
    const now = new Date();
    if (exam.availableTo && now > exam.availableTo) {
      exam.status = statusExam.ENDED;
    } else if (
      exam.availableFrom &&
      now >= exam.availableFrom &&
      (!exam.availableTo || now < exam.availableTo)
    ) {
      exam.status = statusExam.ONGOING;
    } else {
      exam.status = statusExam.NOTSTARTED;
    }
    return await this.coursebyexamRepo.save(exam);
  }
  remove(id: number) {
    return `This action removes a #${id} courseByExam`;
  }
  async removeStudent(courseByExamId: number, studentId: number): Promise<CourseByExam> {
    const courseByExam = await this.coursebyexamRepo.findOne({
      where: { id: courseByExamId },
      relations: ['students'],
    });

    if (!courseByExam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${courseByExamId}`);
    }

    const originalCount = courseByExam.students.length;

    courseByExam.students = courseByExam.students.filter(student => student.id !== studentId);

    if (courseByExam.students.length === originalCount) {
      throw new NotFoundException(`Học sinh với ID: ${studentId} không có trong bài thi`);
    }

    return await this.coursebyexamRepo.save(courseByExam);
  }
  async joinCourseByExam(
    courseByExamId: number,
    student: User,
    dto: JoinCourseByExamDto,
  ): Promise<CourseByExam> {
    const courseByExam = await this.coursebyexamRepo.findOne({
      where: { id: courseByExamId },
      relations: ['students'],
    });

    if (!courseByExam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${courseByExamId}`);
    }

    // Kiểm tra trạng thái (chỉ cho phép tham gia khi đang diễn ra)
    if (courseByExam.status !== statusExam.ONGOING) {
      throw new BadRequestException('Bài thi hiện không sẵn sàng để tham gia.');
    }

    // Kiểm tra thời gian thực (để chắc chắn)
    const now = new Date();
    if (courseByExam.availableFrom && now < courseByExam.availableFrom) {
      throw new BadRequestException('Bài thi chưa mở.');
    }
    if (courseByExam.availableTo && now > courseByExam.availableTo) {
      throw new BadRequestException('Bài thi đã kết thúc.');
    }

    // Kiểm tra học sinh đã tham gia chưa
    const hasJoined = courseByExam.students.some(s => s.id === student.id);
    if (hasJoined) {
      throw new BadRequestException('Bạn đã tham gia bài thi này.');
    }

    // Nếu bị khóa thì kiểm tra mật khẩu
    if (courseByExam.isLocked) {
      if (!dto.password) {
        throw new BadRequestException('Bài thi bị khóa. Vui lòng nhập mật khẩu.');
      }

      const isValidPassword = await bcrypt.compare(dto.password, courseByExam.password);
      if (!isValidPassword) {
        throw new BadRequestException('Mật khẩu không đúng.');
      }
    }

    // Thêm học sinh vào danh sách
    courseByExam.students.push(student);
    return await this.coursebyexamRepo.save(courseByExam);
  }
}
