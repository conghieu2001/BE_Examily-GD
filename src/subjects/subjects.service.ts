import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { In, Not, Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
  ) { }
  async create(createSubjectDto: CreateSubjectDto) {
    const { name, classId } = createSubjectDto;
    // console.log(classId)
    // 1. Tìm lớp
    const classEntity = await this.classRepo.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new HttpException('Lớp không tồn tại', 404);
    }
    // 2. Kiểm tra tên môn học đã tồn tại trong lớp chưa
    const namesubject = `${name} ${classEntity.name}`;
    const existingSubject = await this.subjectRepo.findOne({
      where: {
        name: namesubject,
        class: { id: classId },
      },
    });
    // console.log(existingSubject)
    if (existingSubject) {
      throw new HttpException(`Môn học với tên này đã tồn tại trong lớp ${classEntity.name}`, 400);
    }

    // 3. Tạo subject mới
    const newSubject = await this.subjectRepo.save({
      name: namesubject,
      class: classEntity,
    });
    return newSubject;
  }
  async findAll(
    pageOptions: PageOptionsDto,
    rawQuery: Record<string, any>,
  ): Promise<PageDto<Subject>> {
    const queryBuilder = this.subjectRepo.createQueryBuilder('subject')
      .leftJoinAndSelect('subject.class', 'class');

    const { page, take, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo query (bỏ các param phân trang)
    Object.keys(rawQuery).forEach(key => {
      if (!paginationParams.includes(key) && rawQuery[key] !== undefined) {
        if (key === 'classId') {
          // Nếu là mảng classId
          const classIds = String(rawQuery[key])
            .split(',')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id));

          if (classIds.length > 0) {
            queryBuilder.andWhere('class.id IN (:...classIds)', { classIds });
          }
        } else {
          queryBuilder.andWhere(`subject.${key} = :${key}`, { [key]: rawQuery[key] });
        }
      }
    });

    // 🔍 Tìm kiếm theo tên môn học
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(subject.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // 🧾 Nếu có take thì áp dụng phân trang
    const hasTake = Object.prototype.hasOwnProperty.call(rawQuery, 'take');
    if (hasTake) {
      queryBuilder.skip(skip).take(take);
    }

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, new PageMetaDto({ pageOptionsDto: pageOptions, itemCount }));
  }
  async findOne(id: number) {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['class'], // Thêm relations nếu cần
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID: ${id}`);
    }

    return subject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const { name, classId } = updateSubjectDto;

    // 1. Tìm subject hiện tại
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['class'],
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID: ${id}`);
    }

    // 2. Lấy class mới nếu có thay đổi classId
    let classEntity = subject.class;
    if (classId && classId !== subject.class.id) {
      const classFound = await this.classRepo.findOne({ where: { id: classId } });
      if (!classFound) {
        throw new NotFoundException(`Không tìm thấy lớp với ID: ${classId}`);
      }
      classEntity = classFound;
    }

    // 3. Gộp tên mới nếu có thay đổi
    const newName = name ?? subject.name.replace(` ${subject.class.name}`, '');
    const nameSubjectFull = `${newName} ${classEntity.name}`;

    // 4. Kiểm tra trùng tên subject trong cùng lớp
    const existing = await this.subjectRepo.findOne({
      where: {
        id: Not(id),
        name: nameSubjectFull,
        class: { id: classEntity.id },
      },
    });

    if (existing) {
      throw new BadRequestException(`Môn học '${nameSubjectFull}' đã tồn tại trong lớp ${classEntity.name}`);
    }

    // 5. Cập nhật subject
    subject.name = nameSubjectFull;
    subject.class = classEntity;

    return this.subjectRepo.save(subject);
  }
  async remove(id: number) {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['class'],
    });

    if (!subject) {
      throw new NotFoundException('Subject không tồn tại');
    }

    await this.subjectRepo.softDelete({ id });
    return subject;
  }
}
