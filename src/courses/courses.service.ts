import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>
  ) { }
  async create(createCourseDto: CreateCourseDto, user: User) {
    const { name, description } = createCourseDto;
    if (await this.courseRepo.findOne({ where: { name } })) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
    const newCourse = this.courseRepo.create({
      name,
      description,
      createdBy: user?.isAdmin ? user : null,
    });
    return await this.courseRepo.save(newCourse);
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<Course>): Promise<PageDto<Course>> {
    const queryBuilder = this.courseRepo.createQueryBuilder('course');
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

  async findOne(id: number): Promise<ItemDto<Course>> {
    const example = await this.courseRepo.findOne({ where: { id }, relations: ['createdBy'] });
    if (!example) {
      throw new NotFoundException(` Không tìm thấy Group với ID: ${id}`)
    }
    return new ItemDto(example);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({ where: { id } });

    if (!course) {
      throw new HttpException('Nhóm không tồn tại', 404);
    }
    // Nếu tên được cập nhật, kiểm tra trùng lặp
    if (updateCourseDto.name && updateCourseDto.name !== course.name) {
      const existingCourse = await this.courseRepo.findOne({ where: { name: updateCourseDto.name } });
      if (existingCourse) {
        throw new HttpException('Tên nhóm đã tồn tại', 409);
      }
    }

    // Cập nhật
    Object.assign(course, updateCourseDto);
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
}
