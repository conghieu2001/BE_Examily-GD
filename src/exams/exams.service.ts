import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { paginationKeyword } from 'src/utils/keywork-pagination';
import { Question } from 'src/questions/entities/question.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,

    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) { }

  async create(createExamDto: CreateExamDto, user: User) {
    const { courseId, title, description, durationMinutes, questionIds = [] } = createExamDto;

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course không tồn tại');
    }

    const existing = await this.examRepo.findOne({
      where: {
        title: title,
        course: { id: courseId }
      },
      relations: ['course']
    });

    if (existing) {
      throw new BadRequestException('Tiêu đề đã tồn tại trong khóa học');
    }

    const exam = this.examRepo.create({
      title,
      description,
      durationMinutes,
      course,
      createdBy: user?.isAdmin ? user : null,
    });

    const savedExam = await this.examRepo.save(exam);

    // ✅ Gán các câu hỏi nếu có
    if (questionIds.length > 0) {
      await this.questionRepo.update(
        { id: In(questionIds) },
        { exam: savedExam }
      );
    }

    return savedExam;
  }


  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Exam>,
  ): Promise<PageDto<Exam>> {
    const queryBuilder = this.examRepo
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.course', 'course')
      .leftJoinAndSelect('exam.createdBy', 'createdBy');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const pagination: string[] = paginationKeyword;

    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!pagination.includes(key)) {
          queryBuilder.andWhere(`exam.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    if (search) {
      queryBuilder.andWhere(
        `(LOWER(unaccent(exam.title)) ILIKE LOWER(unaccent(:search)) 
        OR LOWER(unaccent(exam.description)) ILIKE LOWER(unaccent(:search)))`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('exam.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number): Promise<ItemDto<Exam>> {
    const exam = await this.examRepo.findOne({ where: { id }, relations: ['createdBy', 'course'] });
    if (!exam) {
      throw new NotFoundException(`Không tìm thấy Exam với ID: ${id}`);
    }
    return new ItemDto(exam);
  }

  async update(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.examRepo.findOne({ where: { id } });

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }

    const { title, description, durationMinutes } = updateExamDto;

    if (title !== undefined) {
      exam.title = title;
    }

    if (description !== undefined) {
      exam.description = description;
    }

    if (durationMinutes !== undefined) {
      exam.durationMinutes = durationMinutes;
    }

    return await this.examRepo.save(exam);
  }

  async remove(id: number): Promise<ItemDto<Exam>> {
    const checkExam = await this.examRepo.findOne({
      where: { id },
      relations: ['createdBy', 'course'],
    });

    if (!checkExam) {
      throw new NotFoundException(`Không tìm thấy Exam với ID: ${id}`);
    }

    await this.examRepo.softRemove(checkExam);
    return new ItemDto(checkExam);
  }
}
