import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionCloneDto } from './dto/create-question-clone.dto';
import { UpdateQuestionCloneDto } from './dto/update-question-clone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionClone } from './entities/question-clone.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { MultipeChoice } from 'src/multipe-choice/entities/multipe-choice.entity';
import { AnswerClone } from 'src/answer-clone/entities/answer-clone.entity';
import { User } from 'src/users/entities/user.entity';
import { AnswerCloneService } from 'src/answer-clone/answer-clone.service';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { paginationKeyword } from 'src/utils/keywork-pagination';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class QuestionCloneService {
  constructor(
    @InjectRepository(QuestionClone) private questionCloneRepo: Repository<QuestionClone>,
    @InjectRepository(TypeQuestion) private typeQuestionRepo: Repository<TypeQuestion>,
    @InjectRepository(MultipeChoice) private multipeChoiceRepo: Repository<MultipeChoice>,
    @InjectRepository(AnswerClone) private answerCloneRepo: Repository<AnswerClone>,
    @Inject(forwardRef(() => AnswerCloneService))
    private readonly answercloneService: AnswerCloneService,
  ) { }
  async create(createQuestionCloneDto: CreateQuestionCloneDto, user: User): Promise<QuestionClone> {
    const { content, typeQuestionId, multipleChoiceId, score, answerclones } = createQuestionCloneDto
    // Tìm các entity liên quan
    const typeQuestion = await this.typeQuestionRepo.findOne({ where: { id: typeQuestionId } });

    if (!typeQuestion) {
      throw new BadRequestException('TypeQuestion không tồn tại');
    }
    if (typeQuestion.name === 'multiple_choice') {
      const mc = await this.multipeChoiceRepo.findOne({ where: { id: multipleChoiceId } });
      if (!mc) {
        throw new BadRequestException('Multiple choice không tồn tại');
      }
      //Tạo câu hỏi
      const newQuestionClone = this.questionCloneRepo.create({
        content,
        typeQuestion,
        multipleChoice: mc,
        score,
        createdBy: user
      })
      const questionClone = await this.questionCloneRepo.save(newQuestionClone)

      const validAnswerClones = answerclones.filter(a => a.content?.trim())
      for (const ans of validAnswerClones) {
        await this.answercloneService.create({
          content: ans.content,
          isCorrect: ans.isCorrect,
          questioncloneId: questionClone.id
        }, user)
      }
      return questionClone
    } else {
      //Tạo câu hỏi
      const newQuestionClone = this.questionCloneRepo.create({
        content,
        typeQuestion,
        multipleChoice: undefined,
        answerclones: undefined,
        score,
        createdBy: user
      })
      const questionClone = await this.questionCloneRepo.save(newQuestionClone)
      return questionClone
    }
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<QuestionClone> & { createdById?: number },
  ): Promise<PageDto<QuestionClone>> {
    const queryBuilder = this.questionCloneRepo
      .createQueryBuilder('questionclone')
      .leftJoinAndSelect('questionclone.typeQuestion', 'typeQuestion')
      .leftJoinAndSelect('questionclone.multipleChoice', 'multipleChoice')
      .leftJoinAndSelect('questionclone.createdBy', 'createdBy')
      .leftJoinAndSelect('questionclone.answerclones', 'answerclones');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = paginationKeyword;

    // 🔍 Lọc theo điều kiện
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key) && query[key] !== undefined) {
          if (key === 'createdById') {
            queryBuilder.andWhere('createdBy.id = :createdById', {
              createdById: query[key],
            });
          } else if (key === 'typeQuestionId') {
            queryBuilder.andWhere('typeQuestion.id = :typeQuestionId', {
              typeQuestionId: query[key],
            });
          } else {
            queryBuilder.andWhere(`questionclone.${key} = :${key}`, {
              [key]: query[key],
            });
          }
        }
      }
    }

    // 🔍 Tìm kiếm theo content
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(questionclone.content)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // 🧾 Sắp xếp & phân trang
    const hasTake = 'take' in query && !isNaN(parseInt(query.take as string));

    queryBuilder.orderBy('questionclone.id', order);
    if (hasTake) {
      queryBuilder.skip(skip).take(parseInt(query.take as string));
    }

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();

    // ✅ Sắp xếp answerclones theo id tăng dần (nếu có)
    for (const question of items) {
      if (Array.isArray(question.answerclones)) {
        question.answerclones.sort((a, b) => a.id - b.id);
      }
    }

    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    return new PageDto(items, pageMetaDto);
  }
  async findOne(id: number): Promise<ItemDto<QuestionClone>> {
    const questionclone = await this.questionCloneRepo.findOne({
      where: { id },
      relations: [
        'typeQuestion',
        'multipleChoice',
        'createdBy',
      ]
    })
    if (!questionclone) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }
    // Truy vấn answers theo id tăng dần
    questionclone.answerclones = await this.answerCloneRepo.find({
      where: { questionclone: { id } },
      order: { id: 'ASC' },
    });

    return new ItemDto(questionclone);
  }
  async update(id: number, updateQuestionCloneDto: UpdateQuestionCloneDto, user: User) {
    const questionclone = await this.questionCloneRepo.findOne({
      where: { id },
      relations: ['createdBy', 'answers'],
    })
    if (!questionclone) {
      throw new NotFoundException(`Không tìm thấy questionclone với ID: ${id}`);
    }
    if (!(user && (user.isAdmin === true || questionclone.createdBy?.id === user.id))) {
      throw new ForbiddenException('Bạn không có quyền cập nhật câu hỏi này');
    }
    const {
      content,
      typeQuestionId,
      multipleChoiceId,
      answerclones
    } = updateQuestionCloneDto
    if (content !== undefined) questionclone.content = content;
    if (multipleChoiceId !== undefined) {
      const multipleChoice = await this.multipeChoiceRepo.findOne({ where: { id: multipleChoiceId } });
      if (!multipleChoice) throw new NotFoundException('MultipleChoice không tồn tại');
      questionclone.multipleChoice = multipleChoice;
    }
    if (typeQuestionId !== undefined) {
      const tq = await this.typeQuestionRepo.findOne({ where: { id: typeQuestionId } });
      if (!tq) throw new NotFoundException('Type_Question không tồn tại');
      questionclone.typeQuestion = tq;
    }

    // ✅ Cập nhật từng answer theo ID
    if (answerclones && Array.isArray(answerclones)) {
      // console.log(answers)
      questionclone.answerclones.sort((a, b) => a.id - b.id);
      for (let i = 0; i < answerclones.length; i++) {
        const a = answerclones[i] as any
        const answer = questionclone.answerclones[i]
        // console.log(a, answer)
        const updated = this.answerCloneRepo.merge(answer, {
          content: a.content,
          isCorrect: a.isCorrect,
        });
        await this.answerCloneRepo.update(answer.id, updated);
      }
    }
    const updated = await this.questionCloneRepo.save(questionclone);
    return new ItemDto(updated);
  }
  remove(id: number) {
    return `This action removes a #${id} questionClone`;
  }
}
