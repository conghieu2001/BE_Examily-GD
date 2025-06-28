import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCousememberDto } from './dto/create-coursemembers.dto';
import { UpdateCousememberDto } from './dto/update-coursemembers.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { CourseMember } from './entities/cousemember.entity';

@Injectable()
export class CousemembersService {
  constructor(
    @InjectRepository(CourseMember) private coursememberRepo: Repository<CourseMember>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }
  async create(createCousememberDto: CreateCousememberDto, user: User) {
    const { courseId, userId } = createCousememberDto
    const checkUser = await this.userRepo.findOne({ where: { id: userId } });
    if (!checkUser) throw new NotFoundException('User not found');

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Kiểm tra nếu user đã là thành viên
    const existing = await this.coursememberRepo.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });
    if (existing) throw new BadRequestException('User này đã là thành viên của Group');

    const groupMember = this.coursememberRepo.create({
      user: user,
      course: course,
      // role_in_course: role_in_course || 'member',
      createdBy: user?.isAdmin ? user : null,
    });

    return this.coursememberRepo.save(groupMember);
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<CourseMember>): Promise<PageDto<CourseMember>> {
    const queryBuilder = this.coursememberRepo
      .createQueryBuilder('coursemember')
      .leftJoinAndSelect('coursemember.user', 'user')
      .leftJoinAndSelect('coursemember.group', 'course');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường cụ thể
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`coursemember.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm tên user hoặc tên group nếu có search
    if (search) {
      queryBuilder.andWhere(
        `(LOWER(unaccent(user.email)) ILIKE LOWER(unaccent(:search)) OR LOWER(unaccent(group.name)) ILIKE LOWER(unaccent(:search)))`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('coursemember.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number): Promise<ItemDto<CourseMember>> {
    const example = await this.coursememberRepo.findOne({ where: { id }, relations: ['createdBy', 'user', 'course'] });
    if (!example) {
      throw new NotFoundException(` Không tìm thấy groupmember với ID: ${id}`)
    }
    return new ItemDto(example);
  }

  update(id: number, updateCousememberDto: UpdateCousememberDto) {
    return `This action updates a #${id} cousemember`;
  }

  async remove(id: number): Promise<ItemDto<CourseMember>> {
    const coursemember = await this.coursememberRepo.findOne({
      where: { id },
      relations: ['user', 'course'],
    });

    if (!coursemember) {
      throw new NotFoundException(`Không tìm thấy coursemember với ID: ${id}`);
    }

    await this.coursememberRepo.softRemove(coursemember);
    return new ItemDto(coursemember);
  }
}
