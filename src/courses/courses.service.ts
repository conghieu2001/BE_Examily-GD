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

    // Nếu khóa thì bắt buộc có mật khẩu
    // if (!password) {
    //   throw new BadRequestException('Khóa học bị khóa phải có mật khẩu');
    // }

    // // Mã hóa mật khẩu nếu cần
    // let hashedPassword: string | undefined;
    // if (isLocked && password) {
    // const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, 10);
    // }

    const newCourse = this.courseRepo.create({
      name,
      description,
      // isLocked,
      password: hashedPassword, // chỉ là string hoặc undefined
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

  async findOne(id: number, user: User): Promise<ItemDto<Course>> {
    // console.log(user)
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: [
        'createdBy',
        'createdBy.classes',
        'createdBy.subjects',
        'courseByExams',
        'courseByExams.createdBy',
        'courseByExams.exam',
        'courseByExams.exam.class',
        'courseByExams.exam.subject',
        'courseByExams.students',
      ],
    });

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${id}`);
    }
    const now = new Date();

    if (course.courseByExams) {
      for (let i = 0; i < course.courseByExams.length; i++) {
        const courseByExam = course.courseByExams[i];

        if (courseByExam.availableFrom && courseByExam.availableTo) {
          if (now < courseByExam.availableFrom) {
            courseByExam.status = statusExam.NOTSTARTED;
            await this.courseByExamRepo.save(courseByExam);
          } else if (now >= courseByExam.availableFrom && now <= courseByExam.availableTo) {
            courseByExam.status = statusExam.ONGOING;
            await this.courseByExamRepo.save(courseByExam);
          } else if (now > courseByExam.availableTo) {
            courseByExam.status = statusExam.ENDED;
            await this.courseByExamRepo.save(courseByExam);
          }
        }
      }
    }
    course.courseByExams.sort((a, b) => a.id - b.id);
    if (user?.role === Role.STUDENT) {
      // Học sinh chỉ xem được các bài thi không khóa
      course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);

    } else if (user?.role === Role.TEACHER) {
      const isOwner = course.createdBy?.id === user.id;
      if (!isOwner) {
        // Giáo viên không phải người tạo => chỉ xem bài không khóa
        course.courseByExams = course.courseByExams.filter(cb => !cb.isPublic);
      }
      // Nếu là người tạo thì giữ nguyên tất cả

    } else if (user?.role === Role.ADMIN) {
      // Admin được xem tất cả => giữ nguyên courseByExams

    } else {
      // Không xác định quyền => không được xem gì
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
}
