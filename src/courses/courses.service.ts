import { BadRequestException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import * as bcrypt from 'bcrypt';
import { JoinCourseDto } from './dto/join-course.dto';
import { Role } from 'src/roles/role.enum';
import { CourseByExam, statusExam } from 'src/course-by-exams/entities/course-by-exam.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseByExam) private courseByExamRepo: Repository<CourseByExam>,
  ) { }
  async create(createCourseDto: CreateCourseDto, user: User): Promise<Course> {
    const { name, description, password } = createCourseDto;

    // Kiểm tra tên trùng
    const existing = await this.courseRepo.findOne({ where: { name } });
    if (existing) {
      throw new HttpException('Tên khóa học đã tồn tại', 409);
    }

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newCourse = this.courseRepo.create({
      name,
      description,
      password: hashedPassword, // nếu không truyền sẽ là undefined
      createdBy: user,
    });

    return await this.courseRepo.save(newCourse);
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<Course> & { createdById?: number },): Promise<PageDto<Course>> {
    const queryBuilder = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.classes', 'classes')
      .leftJoinAndSelect('createdBy.subjects', 'subjects')
      .leftJoinAndSelect('course.courseByExams', 'courseByExams');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys: string[] = ['page', 'take', 'skip', 'order', 'search'];
    const { createdById, ...restQuery } = query;
    // Lọc theo createdById nếu có
    if (createdById) {
      queryBuilder.andWhere('createdBy.id = :createdById', { createdById });
    }

    // Lọc theo các trường còn lại của Course
    if (restQuery && Object.keys(restQuery).length > 0) {
      for (const key of Object.keys(restQuery)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`course.${key} = :${key}`, { [key]: restQuery[key] });
        }
      }
    }

    // Tìm kiếm theo tên
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(course.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    // Sắp xếp theo cột hợp lệ
    queryBuilder.orderBy('course.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }
  async findAllByCreator(
    user: User, // user lấy từ req.user
    pageOptions: PageOptionsDto,
    query: Partial<Course>,
  ): Promise<PageDto<Course>> {
    const queryBuilder = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.classes', 'classes')
      .leftJoinAndSelect('createdBy.subjects', 'subjects')
      .leftJoinAndSelect('course.courseByExams', 'courseByExams');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo người tạo
    queryBuilder.andWhere('createdBy.id = :createdById', { createdById: user.id });

    // Lọc các trường khác
    for (const key of Object.keys(query)) {
      if (!paginationKeys.includes(key)) {
        queryBuilder.andWhere(`course.${key} = :${key}`, { [key]: query[key] });
      }
    }

    // Tìm kiếm theo tên
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(course.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // Nếu có truyền take thì phân trang, nếu không thì lấy tất
    if (typeof take === 'number' && !isNaN(take)) {
      queryBuilder.take(take).skip(skip);
    }

    queryBuilder.orderBy('course.id', order);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }
  // async findOne(id: number, user: User): Promise<ItemDto<Course>> {
  //   const course = await this.courseRepo.findOne({
  //     where: { id },
  //     relations: [
  //       'createdBy',
  //       'createdBy.classes',
  //       'createdBy.subjects',
  //       'courseByExams',
  //       'courseByExams.createdBy',
  //       'courseByExams.exam',
  //       'courseByExams.exam.class',
  //       'courseByExams.exam.subject',
  //       'courseByExams.students',
  //     ],
  //   });

  //   if (!course) {
  //     throw new NotFoundException(`Không tìm thấy khóa học với ID: ${id}`);
  //   }

  //   const now = new Date();

  //   // --- Lấy danh sách courseByExamId đã có exam_session ---
  //   const takenList = await this.courseByExamRepo
  //     .createQueryBuilder('cbx')
  //     .select('cbx.id', 'courseByExamId')
  //     .addSelect('COUNT(es.id)', 'sessionCount')
  //     .leftJoin('exam_session', 'es', 'es."courseByExamId" = cbx.id')
  //     .where('cbx.courseId = :courseId', { courseId: id })
  //     .groupBy('cbx.id')
  //     .getRawMany();

  //   const takenMap = new Map<number, boolean>();
  //   takenList.forEach(row => {
  //     takenMap.set(Number(row.courseByExamId), Number(row.sessionCount) > 0);
  //   });

  //   // --- Cập nhật status và isTaken ---
  //   if (course.courseByExams) {
  //     for (let i = 0; i < course.courseByExams.length; i++) {
  //       const courseByExam = course.courseByExams[i];

  //       // Gán trạng thái isTaken
  //       courseByExam['isSubmit'] = takenMap.get(courseByExam.id) || false;

  //       // Gán status theo thời gian
  //       if (courseByExam.availableFrom && courseByExam.availableTo) {
  //         if (now < courseByExam.availableFrom) {
  //           courseByExam.status = statusExam.NOTSTARTED;
  //         } else if (now >= courseByExam.availableFrom && now <= courseByExam.availableTo) {
  //           courseByExam.status = statusExam.ONGOING;
  //         } else if (now > courseByExam.availableTo) {
  //           courseByExam.status = statusExam.ENDED;
  //         }
  //         await this.courseByExamRepo.save(courseByExam);
  //       }
  //     }
  //   }

  //   // --- Sắp xếp ---
  //   course.courseByExams.sort((a, b) => a.id - b.id);

  //   // --- Phân quyền ---
  //   if (user?.role === Role.STUDENT) {
  //     course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
  //   } else if (user?.role === Role.TEACHER) {
  //     const isOwner = course.createdBy?.id === user.id;
  //     if (!isOwner) {
  //       course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
  //     }
  //   } else if (user?.role === Role.ADMIN) {
  //     // Admin giữ nguyên
  //   } else {
  //     course.courseByExams = [];
  //   }

  //   return new ItemDto(course);
  // }
  // 

    async findOne(id: number, user: User): Promise<ItemDto<Course>> {
    const course = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.classes', 'createdByClasses')
      .leftJoinAndSelect('createdBy.subjects', 'createdBySubjects')
      .leftJoinAndSelect('course.courseByExams', 'courseByExams')
      .leftJoinAndSelect('courseByExams.createdBy', 'cbxCreatedBy')
      .leftJoinAndSelect('courseByExams.exam', 'exam')
      .leftJoinAndSelect('exam.class', 'examClass')
      .leftJoinAndSelect('exam.subject', 'examSubject')
      .leftJoinAndSelect('courseByExams.students', 'students')
      .leftJoinAndSelect('courseByExams.examSessions', 'examSessions')
      .leftJoinAndSelect('examSessions.createdBy', 'examSessionUser')
      .where('course.id = :id', { id })
      .getOne();

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${id}`);
    }

    const now = new Date();
    for (const courseByExam of course.courseByExams) {
      if (courseByExam.availableFrom && courseByExam.availableTo) {
        if (now < courseByExam.availableFrom) {
          courseByExam.status = statusExam.NOTSTARTED;
        } else if (now <= courseByExam.availableTo) {
          courseByExam.status = statusExam.ONGOING;
        } else {
          courseByExam.status = statusExam.ENDED;
        }
        await this.courseByExamRepo.save(courseByExam);
      }

      // Lọc examSessions của user hiện tại
      courseByExam.examSessions = (courseByExam.examSessions ?? []).filter(
        es => es.createdBy?.id === user?.id
      );
    }

    course.courseByExams.sort((a, b) => a.id - b.id);

    if (user?.role === Role.STUDENT) {
      course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
    } else if (user?.role === Role.TEACHER) {
      const isOwner = course.createdBy?.id === user.id;
      if (!isOwner) {
        course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
      }
    } else if (user?.role !== Role.ADMIN) {
      course.courseByExams = [];
    }

    return new ItemDto(course);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({ where: { id }, relations: ['createdBy'] });

    if (!course) {
      throw new HttpException('Khóa học không tồn tại', 404);
    }

    const { name, description } = updateCourseDto;

    //Kiểm tra trùng tên nếu đổi tên
    if (name && name !== course.name) {
      const existingCourse = await this.courseRepo.findOne({ where: { name } });
      if (existingCourse) {
        throw new HttpException('Tên khóa học đã tồn tại', 409);
      }
      course.name = name;
    }

    if (description !== undefined) {
      course.description = description;
    }
    // if (password !== undefined) {
    //   course.password = await bcrypt.hash(password, 10);
    // }

    return await this.courseRepo.save(course);
  }
  async remove(id: number): Promise<Course> {
    const isClass = await this.courseRepo.findOne({ where: { id } });
    if (!isClass) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${id}`);
    }
    await this.courseRepo.softDelete(id); // Sử dụng soft delete
    return isClass; // Trả về dữ liệu trước khi xóa
  }
  async checkCoursePassword(courseId: number, password: string): Promise<boolean> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course || !course.password) {
      return false;
    }

    const isMatch = await bcrypt.compare(password, course.password);
    return isMatch;
  }
  async changeCoursePassword(courseId: number, oldPassword: string, newPassword: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['createdBy'] });

    if (!course) {
      throw new NotFoundException('Khóa học không tồn tại');
    }

    // Nếu chưa có mật khẩu thì cho phép đặt mới
    if (!course.password) {
      course.password = await bcrypt.hash(newPassword, 10);
      await this.courseRepo.save(course);
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, course.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    course.password = hashedNewPassword;

    await this.courseRepo.save(course);
  }

  // async joinCourse(courseId: number, user: User, dto: JoinCourseDto): Promise<Course> {
  //   const course = await this.courseRepo.findOne({
  //     where: { id: courseId },
  //     relations: ['users'],
  //   });

  //   if (!course) {
  //     throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
  //   }

  //   //Nếu khóa học bị khóa → kiểm tra mật khẩu
  //   if (course.isLocked) {
  //     if (!dto.password) {
  //       throw new BadRequestException('Khóa học yêu cầu mật khẩu');
  //     }

  //     const isMatch = await bcrypt.compare(dto.password, course.password);
  //     if (!isMatch) {
  //       throw new UnauthorizedException('Sai mật khẩu');
  //     }
  //   }

  //   //Kiểm tra nếu user đã tham gia rồi
  //   const alreadyJoined = course.users.some(u => u.id === user.id);
  //   if (alreadyJoined) {
  //     return course; // hoặc throw new BadRequestException('Đã tham gia khóa học');
  //   }

  //   //Thêm user vào danh sách
  //   course.users.push(user);

  //   return await this.courseRepo.save(course);
  // }

  // async removeUserFromCourse(courseId: number, userId: number): Promise<Course> {
  //   const course = await this.courseRepo.findOne({
  //     where: { id: courseId },
  //     relations: ['users'],
  //   });

  //   if (!course) {
  //     throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
  //   }

  //   const userIndex = course.users.findIndex(user => user.id === userId);
  //   if (userIndex === -1) {
  //     throw new NotFoundException(`Người dùng với ID ${userId} chưa tham gia khóa học này`);
  //   }

  //   // Xoá user khỏi danh sách
  //   course.users.splice(userIndex, 1);

  //   return await this.courseRepo.save(course);
  // }
  // async findOne(id: number, user: User): Promise<ItemDto<Course>> {
  //   const qb = this.courseRepo
  //     .createQueryBuilder('course')
  //     .leftJoinAndSelect('course.createdBy', 'createdBy')
  //     .leftJoinAndSelect('createdBy.classes', 'createdByClasses')
  //     .leftJoinAndSelect('createdBy.subjects', 'createdBySubjects')
  //     .leftJoinAndSelect('course.courseByExams', 'courseByExams')
  //     .leftJoinAndSelect('courseByExams.createdBy', 'cbxCreatedBy')
  //     .leftJoinAndSelect('courseByExams.exam', 'exam')
  //     .leftJoinAndSelect('exam.class', 'examClass')
  //     .leftJoinAndSelect('exam.subject', 'examSubject')

  //     // chỉ lấy id của students
  //     .leftJoin('courseByExams.students', 'students')
  //     .addSelect(['students.id'])

  //     // join examSessions và filter theo user hiện tại
  //     .leftJoinAndSelect('courseByExams.examSessions', 'examSessions')
  //     .leftJoin('examSessions.createdBy', 'examSessionUser')
  //     .andWhere('examSessionUser.id = :userId', { userId: user.id })

  //     .where('course.id = :id', { id });

  //   const course = await qb.getOne();

  //   if (!course) {
  //     throw new NotFoundException(`Không tìm thấy khóa học với ID: ${id}`);
  //   }

  //   const now = new Date();
  //   for (const courseByExam of course.courseByExams) {
  //     if (courseByExam.availableFrom && courseByExam.availableTo) {
  //       if (now < courseByExam.availableFrom) {
  //         courseByExam.status = statusExam.NOTSTARTED;
  //       } else if (now <= courseByExam.availableTo) {
  //         courseByExam.status = statusExam.ONGOING;
  //       } else {
  //         courseByExam.status = statusExam.ENDED;
  //       }
  //       await this.courseByExamRepo.save(courseByExam);
  //     }
  //   }

  //   course.courseByExams.sort((a, b) => a.id - b.id);

  //   if (user.role === Role.STUDENT) {
  //     course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
  //   } else if (user.role === Role.TEACHER) {
  //     const isOwner = course.createdBy?.id === user.id;
  //     if (!isOwner) {
  //       course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
  //     }
  //   } else if (user.role !== Role.ADMIN) {
  //     course.courseByExams = [];
  //   }

  //   return new ItemDto(course);
  // }

}
