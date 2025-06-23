import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
  ) { }
  async create(createQuestionDto: CreateQuestionDto, user: User) {
    const { content, type, examId } = createQuestionDto;
    // Tìm đề thi tương ứng
    const exam = await this.examRepo.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam không tồn tại');
    }
    // (Tùy chọn) Kiểm tra trùng nội dung câu hỏi trong cùng đề
    const existing = await this.questionRepo.findOne({
      where: {
        content,
        exam: { id: examId }
      },
      relations: ['exam']
    });

    if (existing) {
      throw new BadRequestException('Câu hỏi đã tồn tại trong đề thi này');
    }
    const question = this.questionRepo.create({
      content,
      type,
      exam,
      createdBy: user?.isAdmin ? user : null,
    });

    return this.questionRepo.save(question);
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Question>
  ): Promise<PageDto<Question>> {
    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.exam', 'exam')
      .leftJoinAndSelect('question.createdBy', 'createdBy');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các field của question
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`question.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo content
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(question.content)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('question.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }
  async findOne(id: number) {
    const question = await this.questionRepo.findOne({ where: { id }, relations: ['createdBy', 'exam'] });
    if (!question) {
      throw new NotFoundException(` Không tìm thấy Question với ID: ${id}`)
    }
    return new ItemDto(question);
  }

  async update(id: number, updateDto: UpdateQuestionDto): Promise<ItemDto<Question>> {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy', 'exam'],
    });

    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    const { content, type, examId } = updateDto;

    if (content !== undefined) {
      question.content = content;
    }

    if (type !== undefined) {
      question.type = type;
    }

    if (examId !== undefined) {
      const exam = await this.examRepo.findOne({ where: { id: examId } });
      if (!exam) {
        throw new NotFoundException('Exam không tồn tại');
      }
      question.exam = exam;
    }

    const updated = await this.questionRepo.save(question);
    return new ItemDto(updated);
  }


  async remove(id: number): Promise<ItemDto<Question>> {
    const checkQuestion = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy', 'exam'],
    });

    if (!checkQuestion) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    await this.questionRepo.softRemove(checkQuestion);
    return new ItemDto(checkQuestion);
  }
}
