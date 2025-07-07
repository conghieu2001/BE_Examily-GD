import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { DeepPartial, Repository, ReturnDocument } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Topic } from 'src/topics/entities/topic.entity';
import { Level } from 'src/levels/entities/level.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { AnswersService } from 'src/answers/answers.service';
import { CreateAnswerDto } from 'src/answers/dto/create-answer.dto';
import { Class } from 'src/classes/entities/class.entity';
import { Answer } from 'src/answers/entities/answer.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { paginationKeyword } from 'src/utils/keywork-pagination';
import { MultipeChoice } from 'src/multipe-choice/entities/multipe-choice.entity';
import { after } from 'node:test';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Level) private levelRepo: Repository<Level>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(TypeQuestion) private typeQuestionRepo: Repository<TypeQuestion>,
    @InjectRepository(MultipeChoice) private multipeChoiceRepo: Repository<MultipeChoice>,
    @InjectRepository(Answer) private answerRepo: Repository<Answer>,
    @Inject(forwardRef(() => AnswersService))
    private readonly answerService: AnswersService,
  ) { }
  async create(createQuestionDto: CreateQuestionDto, user: User): Promise<Question> {
    try {
      const {
        content,
        answers,
        typeQuestionId,
        multipleChoiceId,
        // examId,
        subjectId,
        topicId,
        levelId,
        classId,
        // score,
      } = createQuestionDto;

      // Tìm các entity liên quan
      // const exam = await this.examRepo.findOne({ where: { id: examId } });
      // if (!exam) throw new NotFoundException('Exam không tồn tại');
      const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
      const topic = await this.topicRepo.findOne({ where: { id: topicId } });
      const level = await this.levelRepo.findOne({ where: { id: levelId } });
      const checkclass = await this.classRepo.findOne({ where: { id: classId } });
      const typeQuestion = await this.typeQuestionRepo.findOne({ where: { id: typeQuestionId } });
      const mc = await this.multipeChoiceRepo.findOne({ where: { id: multipleChoiceId } });

      // Kiểm tra trùng nội dung trong đề thi
      // const existing = await this.questionRepo.findOne({
      //   where: { content, exam: { id: examId } },
      //   relations: ['exam'],
      // });
      // if (existing) throw new BadRequestException('Câu hỏi đã tồn tại trong đề thi này');
      if (!subject || !topic || !level || !checkclass || !typeQuestion || !mc) {
        throw new BadRequestException('Subject, Topic, Level, Class, TypeQuestion, Multiple choice không tồn tại');
      }
      // Tạo câu hỏi
      const newQuestion = this.questionRepo.create({
        content,
        typeQuestion,
        multipleChoice: mc,
        // exam,
        subject,
        topic,
        level,
        class: checkclass,
        // score: Number(score),
        createdBy: user,
      } as DeepPartial<Question>);
      const question = await this.questionRepo.save(newQuestion);
      // console.log(question)
      // Xử lý danh sách câu trả lời
      const validAnswers = answers.filter(a => a.content?.trim());
      for (const answer of validAnswers) {
        await this.answerService.create({
          content: answer.content,
          isCorrect: answer.isCorrect,
          questionId: question.id,
        }, user);
      }
      return question;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Tạo câu hỏi thất bại');
    }

  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Question>,
  ): Promise<PageDto<Question>> {
    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.subject', 'subject')
      .leftJoinAndSelect('question.topic', 'topic')
      .leftJoinAndSelect('question.level', 'level')
      .leftJoinAndSelect('question.class', 'class')
      .leftJoinAndSelect('question.answers', 'answers')
      .leftJoinAndSelect('question.typeQuestion', 'typeQuestion')
      .leftJoinAndSelect('question.multipleChoice', 'multipleChoice')
      .leftJoinAndSelect('question.createdBy', 'createdBy');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const pagination: string[] = paginationKeyword;

    // Lọc theo các trường truyền vào query (vd: subjectId, levelId, type, etc.)
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!pagination.includes(key) && query[key] !== undefined) {
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
  async findOne(id: number): Promise<ItemDto<Question>> {
    // console.log(id)
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: [
        'subject',
        'topic',
        'level',
        'class',
        'typeQuestion',
        'multipleChoice',
        'createdBy',
      ],
    });

    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    // Truy vấn answers theo id tăng dần
    question.answers = await this.answerRepo.find({
      where: { question: { id } },
      order: { id: 'ASC' }, // sắp xếp theo id nếu không có field order
    });

    return new ItemDto(question);
  }
  async update(id: number, updateDto: UpdateQuestionDto) {
    // console.log(id, 'efef')
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy', 'subject', 'topic', 'level', 'class', 'answers'],
    });
    // console.log(question.id)
    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    const {
      content,
      typeQuestionId,
      multipleChoiceId,
      subjectId,
      topicId,
      levelId,
      classId,
      answers,
    } = updateDto;

    if (content !== undefined) question.content = content;

    if (subjectId !== undefined) {
      const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
      if (!subject) throw new NotFoundException('Subject không tồn tại');
      question.subject = subject;
    }

    if (multipleChoiceId !== undefined) {
      const multipleChoice = await this.multipeChoiceRepo.findOne({ where: { id: multipleChoiceId } });
      if (!multipleChoice) throw new NotFoundException('MultipleChoice không tồn tại');
      question.multipleChoice = multipleChoice;
    }

    if (topicId !== undefined) {
      const topic = await this.topicRepo.findOne({ where: { id: topicId } });
      if (!topic) throw new NotFoundException('Topic không tồn tại');
      question.topic = topic;
    }

    if (typeQuestionId !== undefined) {
      const tq = await this.typeQuestionRepo.findOne({ where: { id: typeQuestionId } });
      if (!tq) throw new NotFoundException('Type_Question không tồn tại');
      question.typeQuestion = tq;
    }

    if (levelId !== undefined) {
      const level = await this.levelRepo.findOne({ where: { id: levelId } });
      if (!level) throw new NotFoundException('Level không tồn tại');
      question.level = level;
    }

    if (classId !== undefined) {
      const classEntity = await this.classRepo.findOne({ where: { id: classId } });
      if (!classEntity) throw new NotFoundException('Class không tồn tại');
      question.class = classEntity;
    }
    // ✅ Cập nhật từng answer theo ID
    if (answers && Array.isArray(answers)) {
      // console.log(answers)
      
      for (let i=0; i<answers.length; i++) {
        const a = answers[i] as any
        const answer = question.answers[i]
    
        const updated = this.answerRepo.merge(answer, {
          content: a.content,
          isCorrect: a.isCorrect,
        });
        await this.answerRepo.update(answer.id, updated);
      }
    }
    const updated = await this.questionRepo.save(question);
    return new ItemDto(updated);
  }

  async remove(id: number): Promise<ItemDto<Question>> {
    const checkQuestion = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!checkQuestion) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    await this.questionRepo.softRemove(checkQuestion);
    return new ItemDto(checkQuestion);
  }
  async findByType(typeCode: number): Promise<Question[]> {
    const type = await this.multipeChoiceRepo.findOne({
      where: { id: typeCode },
    });

    if (!type) {
      throw new NotFoundException(`Không tồn tại`);
    }

    return this.questionRepo.find({
      where: { multipleChoice: { id: type.id } },
      relations: ['answers', 'subject', 'topic', 'level', 'class', 'multipleChoice', 'typeQuestion'],
    });
  }
}
