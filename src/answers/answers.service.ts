import { ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { Question } from 'src/questions/entities/question.entity';
import { DeepPartial, Repository } from 'typeorm';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer) private answerRepo: Repository<Answer>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
  ) { }
  async create(createAnswerDto: CreateAnswerDto, user: User): Promise<Answer> {
    const { content, questionId, isCorrect } = createAnswerDto;
    const question = await this.questionRepo.findOne({
      where: { id: questionId },
    });
    const newAnswer = this.answerRepo.create({
      content,
      isCorrect,
      question,
      createdBy: user,
    } as DeepPartial<Question>);

    return await this.questionRepo.save(newAnswer);
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Answer>,
    user: User,
  ): Promise<PageDto<Answer>> {
    const queryBuilder = this.answerRepo
      .createQueryBuilder('Answer')


    const { page, take, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'take', 'skip', 'order', 'search'];



    // 🎯 Lọc theo điều kiện tìm kiếm (bỏ qua các tham số phân trang)
    if (!!query && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`Answer.${key} = :${key}`, {
            [key]: query[key],
          });
        }
      });
    }


    // 🎯 Tìm kiếm theo tên môn học (bỏ dấu)
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent("Answer".name)) ILIKE LOWER(unaccent(:search))`,
        {
          search: `%${search}%`,
        },
      );
    }

    // 🎯 Phân trang và sắp xếp
    queryBuilder.orderBy('Answer.createdAt', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(
      entities,
      new PageMetaDto({ pageOptionsDto: pageOptions, itemCount }),
    );
  }

  async findOne(id: number): Promise<ItemDto<Answer>> {
    const example = await this.answerRepo.findOne({ where: { id } });
    if (!example) {
      throw new HttpException('Not found', 404);
    }
    return new ItemDto(example);
  }

  async update(id: number, updateAnswerDto: UpdateAnswerDto) {
    const { content, isCorrect } = updateAnswerDto;


    const example = await this.answerRepo.findOne({ where: { id } });

    if (!example) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }

    this.answerRepo.merge(example, { content, isCorrect });

    await this.answerRepo.update(id, example);

    return new ItemDto(example);
  }

  async remove(id: number, user: User) {
    const example = await this.answerRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!example) {
      throw new NotFoundException('Không tìm thấy tài nguyên');
    }

    if (!example?.createdBy?.isAdmin) {
      console.log(user);
      throw new ForbiddenException('Không có quyền xóa');
    }
    await this.answerRepo.delete(id);
    return new ItemDto(await this.answerRepo.delete(id));
  }
}
