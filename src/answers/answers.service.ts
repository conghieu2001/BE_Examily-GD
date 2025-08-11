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
  async create(createAnswerDto: CreateAnswerDto, user: User) {
    // console.log('question')
    const { content, questionId, isCorrect } = createAnswerDto;
    // console.log(content, questionId, isCorrect)
    const question = await this.questionRepo.findOne({
      where: { id: questionId }, relations: ['answers'],
    });
    // console.log(question)
    return await this.answerRepo.save({
      content,
      isCorrect,
      question,
      createdBy: user,
    } as DeepPartial<Question>);
    // console.log(newAnswer)
    // return await this.answerRepo.save(newAnswer);
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
    console.log(id,updateAnswerDto)

    const answer = await this.answerRepo.findOne({ where: { id } });
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }

    // Chỉ cập nhật nếu khác
    if (content !== undefined && answer.content !== content) {
      answer.content = content;
    }

    if (isCorrect !== undefined) {
      const normalizedIsCorrect =
        typeof isCorrect === 'string' ? isCorrect === 'true' : !!isCorrect;

      if (answer.isCorrect !== normalizedIsCorrect) {
        answer.isCorrect = normalizedIsCorrect;
      }
    }
    this.answerRepo.merge(answer, updateAnswerDto)
    console.log(answer,'answer')
    return await this.answerRepo.update(id,answer);
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
