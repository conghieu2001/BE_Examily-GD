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
import { ExamSession } from 'src/exam-session/entities/exam-session.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { ExamsService } from 'src/exams/exams.service';

@Injectable()
export class CourseByExamsService {
  constructor(
    @InjectRepository(CourseByExam) private coursebyexamRepo: Repository<CourseByExam>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(ExamSession) private examSessionRepo: Repository<ExamSession>,
    private readonly examService: ExamsService,
  ) { }
  async create(createCourseByExamDto: CreateCourseByExamDto, user: User): Promise<CourseByExam> {
    const { examId, courseId, password, availableFrom, availableTo, title, isPublic } = createCourseByExamDto
    const exam = await this.examRepo.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Không tìm thấy đề thi gốc với ID: ${examId}`);
    }
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }
    const createExamClone = await this.examService.cloneByExanOrigin(examId, title, user)
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
    let hashedPassword: string | undefined = undefined;

    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    // console.log(user)
    const data = {
      title,
      exam: createExamClone,
      course,
      isPublic,
      password: hashedPassword,
      status: computedStatus,
      availableFrom: from,
      availableTo: to,
      createdBy: user,
    }
    // console.log(data)
    const newEntry = await this.coursebyexamRepo.save(data);
    // console.log(newEntry)
    return newEntry;
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<CourseByExam>,
  ): Promise<PageDto<CourseByExam>> {
    const queryBuilder = this.coursebyexamRepo.createQueryBuilder('courseByExam')
      .leftJoinAndSelect('courseByExam.course', 'course')
      .leftJoinAndSelect('courseByExam.createdBy', 'createdBy')
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
  async findOne(id: number, user: User) {
    const courseByExam = await this.coursebyexamRepo.findOne({
      where: { id },
      relations: ['createdBy', 'students'],
    });

    if (!courseByExam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }
    if (user && courseByExam.createdBy && user.id === courseByExam.createdBy.id) {
      return await this.coursebyexamRepo.findOne({
        where: { id },
        relations: ['exam', 'exam.questionclones', 'course', 'students'],
      });
    } else {
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
      const hasJoined = Array.isArray(courseByExam.students) &&
        courseByExam.students.some(s => s.id === user.id);
      if (!hasJoined) {
        courseByExam.students.push(user);
        await this.coursebyexamRepo.save(courseByExam);
      }
      return await this.coursebyexamRepo.findOne({
        where: { id },
        relations: ['exam', 'exam.questionclones', 'course'],
      });
    }
  }
  async update(
    id: number,
    dto: UpdateCourseByExamDto,
    user: User
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
      isPublic,
      // password,
      availableFrom,
      availableTo,
      examId,
      courseId,
    } = dto;

    if (title !== undefined) {
      exam.title = title;
    }
    if (isPublic !== undefined) exam.isPublic = isPublic;
    if (availableFrom !== undefined) exam.availableFrom = new Date(availableFrom);
    if (availableTo !== undefined) exam.availableTo = new Date(availableTo);

    // if (password) {
    //   const bcrypt = await import('bcrypt');
    //   exam.password = await bcrypt.hash(password, 10);
    // }

    if (examId && exam.exam.id !== examId) {
      const newExam = await this.examRepo.findOne({ where: { id: examId } });
      if (!newExam) {
        throw new NotFoundException(`Exam với ID ${examId} không tồn tại`);
      }
      const createExamClone = await this.examService.clone(examId, user)
      exam.exam = createExamClone;
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
    // if (courseByExam.isLocked) {
    //   if (!dto.password) {
    //     throw new BadRequestException('Bài thi bị khóa. Vui lòng nhập mật khẩu.');
    //   }

    //   const isValidPassword = await bcrypt.compare(dto.password, courseByExam.password);
    //   if (!isValidPassword) {
    //     throw new BadRequestException('Mật khẩu không đúng.');
    //   }
    // }

    // Thêm học sinh vào danh sách
    courseByExam.students.push(student);
    return await this.coursebyexamRepo.save(courseByExam);
  }
  async getOrStartExamSession(id: number, user: User, password?: string) {
    // console.log(password)
    const courseByExam = await this.coursebyexamRepo.findOne({
      where: { id },
      relations: ['createdBy', 'students', 'exam', 'exam.class', 'exam.subject',
        'exam.questionclones', 'exam.questionclones.answerclones',
        'exam.questionclones.typeQuestion', 'exam.questionclones.multipleChoice', 'course'],
    });
    // console.log(courseByExam)
    if (!courseByExam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }
    // Nếu là giáo viên (người tạo)
    // console.log(courseByExam.createdBy)
    if (user && Number(courseByExam.createdBy?.id) === Number(user.id)) {
      console.log(courseByExam)
      return {
        courseByExam,
      };
    }
    // Kiểm tra mật khẩu nếu có
    if (courseByExam.password !== null) {
      const isMatch = await bcrypt.compare(password, courseByExam.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu không chính xác.');
      }
    }
    const now = new Date();

    // Cập nhật trạng thái dựa theo thời gian hiện tại
    if (courseByExam.availableFrom && courseByExam.availableTo) {
      if (now < courseByExam.availableFrom && courseByExam.status !== statusExam.NOTSTARTED) {
        courseByExam.status = statusExam.NOTSTARTED;
        await this.coursebyexamRepo.save(courseByExam);
      } else if (
        now >= courseByExam.availableFrom &&
        now <= courseByExam.availableTo &&
        courseByExam.status !== statusExam.ONGOING
      ) {
        courseByExam.status = statusExam.ONGOING;
        await this.coursebyexamRepo.save(courseByExam);
      } else if (now > courseByExam.availableTo && courseByExam.status !== statusExam.ENDED) {
        courseByExam.status = statusExam.ENDED;
        await this.coursebyexamRepo.save(courseByExam);
      }
    }

    // 🛡️ Nếu là học sinh
    if (courseByExam.status !== statusExam.ONGOING) {
      throw new BadRequestException('Bài thi hiện chưa được mở.');
    }

    if (courseByExam.availableFrom && now < courseByExam.availableFrom) {
      throw new BadRequestException('Bài thi chưa mở.');
    }
    if (courseByExam.availableTo && now > courseByExam.availableTo) {
      throw new BadRequestException('Bài thi đã kết thúc.');
    }

    // Kiểm tra học sinh đã tham gia chưa
    const hasJoined = Array.isArray(courseByExam.students) &&
      courseByExam.students.some(s => s.id === user.id);

    if (!hasJoined) {
      courseByExam.students.push(user);
      await this.coursebyexamRepo.save(courseByExam);
    }

    // Tìm hoặc tạo mới ExamSession
    let examSession = await this.examSessionRepo.findOne({
      where: {
        createdBy: { id: user.id },
        courseByExam: { id: courseByExam.id },
      },
      relations: []
    });

    if (!examSession) {
      const questionIds = courseByExam.exam.questionclones.map(q => q.id);
      const shuffled = questionIds.sort(() => Math.random() - 0.5);

      examSession = this.examSessionRepo.create({
        courseByExam,
        exam: courseByExam.exam,
        startedAt: now,
        isSubmitted: false,
        questionOrder: shuffled,
        createdBy: user
      });

      await this.examSessionRepo.save(examSession);
    }
    const questionMap = new Map<number, QuestionClone>();
    for (const question of courseByExam.exam.questionclones) {
      questionMap.set(question.id, question);
    }
    // console.log(1)
    // console.log(examSession.questionOrder)

    const shuffledQuestions = (examSession.questionOrder ?? [])
      .map(id => {
        const q = questionMap.get(id);
        console.log('question from map:', q);
        if (!q) return null;
        return {
          id: q.id,
          content: q.content,
          typeQuestion: q.typeQuestion,
          multipleChoice: q.multipleChoice,
          score: q.score,
          answerclones: q.answerclones?.map(a => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect,
          })) ?? [],
        };
      })
      .filter(Boolean);
    await this.examRepo.save({ id: courseByExam.exam.id, isCourseByExam: true });
    return {
      examSession,
      questions: shuffledQuestions,
    };
  }
  async changeCourseByExamPassword(courseByExamId: number, oldPassword: string, newPassword: string) {

    const courseByExam = await this.coursebyexamRepo.findOne({ where: { id: courseByExamId } });

    if (!courseByExam) {
      throw new NotFoundException('Không tìm thấy khóa học - bài thi');
    }

    // Nếu chưa có mật khẩu -> cho phép đặt mới
    if (!courseByExam.password) {
      courseByExam.password = await bcrypt.hash(newPassword, 10);
      await this.coursebyexamRepo.save(courseByExam);
      return;
    }

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, courseByExam.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    courseByExam.password = await bcrypt.hash(newPassword, 10);
    await this.coursebyexamRepo.save(courseByExam);
    return { message: 'Đổi mật khẩu thành công' };
  }

}
