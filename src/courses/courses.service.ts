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

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>
  ) { }
  async create(createCourseDto: CreateCourseDto, user: User): Promise<Course> {
    const { name, description, isLocked, password } = createCourseDto;

    // Kiểm tra tên trùng
    const existing = await this.courseRepo.findOne({ where: { name } });
    if (existing) {
      throw new HttpException('Tên khóa học đã tồn tại', 409);
    }

    // Nếu khóa thì bắt buộc có mật khẩu
    if (isLocked && !password) {
      throw new BadRequestException('Khóa học bị khóa phải có mật khẩu');
    }

    // Mã hóa mật khẩu nếu cần
    let hashedPassword: string | undefined;
    if (isLocked && password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const newCourse = this.courseRepo.create({
      name,
      description,
      isLocked,
      password: hashedPassword, // chỉ là string hoặc undefined
      createdBy: user?.isAdmin ? user : null,
    });

    return await this.courseRepo.save(newCourse);
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<Course>): Promise<PageDto<Course>> {
    const queryBuilder = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.courseByExams', 'courseByExams');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys: string[] = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường cụ thể trong entity Group
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`course.${key} = :${key}`, { [key]: query[key] });
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

  async findOne(id: number, password?: string): Promise<ItemDto<Course>> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['createdBy', 'courseByExams'],
    });

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${id}`);
    }

    if (course.isLocked) {
      if (!password) {
        throw new BadRequestException('Khóa học này bị khóa, vui lòng cung cấp mật khẩu');
      }

      const isMatch = await bcrypt.compare(password, course.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu không đúng');
      }
    }

    return new ItemDto(course);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({ where: { id } });

    if (!course) {
      throw new HttpException('Khóa học không tồn tại', 404);
    }

    const { name, description, isLocked, password } = updateCourseDto;

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

    if (isLocked !== undefined) {
      course.isLocked = isLocked;
    }

    // Nếu khóa học bị khóa và có mật khẩu mới → mã hóa
    if (isLocked && password) {
      course.password = await bcrypt.hash(password, 10);
    }

    // Nếu bỏ khóa và đang có mật khẩu → xoá mật khẩu
    if (!isLocked) {
      course.password = undefined;
    }

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

  async joinCourse(courseId: number, user: User, dto: JoinCourseDto): Promise<Course> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['users'],
    });

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }

    //Nếu khóa học bị khóa → kiểm tra mật khẩu
    if (course.isLocked) {
      if (!dto.password) {
        throw new BadRequestException('Khóa học yêu cầu mật khẩu');
      }

      const isMatch = await bcrypt.compare(dto.password, course.password);
      if (!isMatch) {
        throw new UnauthorizedException('Sai mật khẩu');
      }
    }

    //Kiểm tra nếu user đã tham gia rồi
    const alreadyJoined = course.users.some(u => u.id === user.id);
    if (alreadyJoined) {
      return course; // hoặc throw new BadRequestException('Đã tham gia khóa học');
    }

    //Thêm user vào danh sách
    course.users.push(user);

    return await this.courseRepo.save(course);
  }

  async removeUserFromCourse(courseId: number, userId: number): Promise<Course> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['users'],
    });

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với ID: ${courseId}`);
    }

    const userIndex = course.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new NotFoundException(`Người dùng với ID ${userId} chưa tham gia khóa học này`);
    }

    // Xoá user khỏi danh sách
    course.users.splice(userIndex, 1);

    return await this.courseRepo.save(course);
  }
}
