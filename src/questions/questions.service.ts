import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { DeepPartial, Repository } from 'typeorm';
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

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Level) private levelRepo: Repository<Level>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    private readonly answerService: AnswersService,
  ) { }
  async create(createQuestionDto: CreateQuestionDto, user: User): Promise<Question> {
    const {
      content,
      answers,
      type,
      examId,
      subjectId,
      topicId,
      levelId,
      classId,
      score,
    } = createQuestionDto;

    // Tìm các entity liên quan
    const exam = await this.examRepo.findOne({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam không tồn tại');

    const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
    const topic = await this.topicRepo.findOne({ where: { id: topicId } });
    const level = await this.levelRepo.findOne({ where: { id: levelId } });
    const checkclass = await this.classRepo.findOne({ where: { id: classId } });

    // Kiểm tra trùng nội dung trong đề thi
    const existing = await this.questionRepo.findOne({
      where: { content, exam: { id: examId } },
      relations: ['exam'],
    });
    if (existing) throw new BadRequestException('Câu hỏi đã tồn tại trong đề thi này');

    // Tạo câu hỏi
    const newQuestion = this.questionRepo.create({
      content,
      type,
      exam,
      subject,
      topic,
      level,
      class: checkclass,
      score,
      createdBy: user,
    } as DeepPartial<Question>);
    const question = await this.questionRepo.save(newQuestion);

    // Xử lý danh sách câu trả lời
    const validAnswers = answers.filter(a => a.content?.trim());
    for (const answer of validAnswers) {
      answer.questionId = question.id;
      await this.answerService.create(answer as CreateAnswerDto, user);
    }

    return question;
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Question>
  ): Promise<PageDto<Question>> {
    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.exam', 'exam')
      .leftJoinAndSelect('question.subject', 'subject')
      .leftJoinAndSelect('question.topic', 'topic')
      .leftJoinAndSelect('question.level', 'level')
      .leftJoinAndSelect('question.class', 'class')
      .leftJoinAndSelect('question.answers', 'answers')
      .leftJoinAndSelect('question.createdBy', 'createdBy');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường truyền vào query (vd: subjectId, levelId...)
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key) && query[key] !== undefined) {
          queryBuilder.andWhere(`question.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo content
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(question.content)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('question.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number): Promise<ItemDto<Question>> {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: [
        'createdBy',
        'exam',
        'subject',
        'topic',
        'level',
        'class',
        'answers',
      ],
    });

    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    return new ItemDto(question);
  }

  async update(id: number, updateDto: UpdateQuestionDto): Promise<ItemDto<Question>> {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy', 'exam', 'subject', 'topic', 'level', 'class'],
    });

    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    const {
      content,
      type,
      examId,
      subjectId,
      topicId,
      levelId,
      classId,
      score,
    } = updateDto;

    if (content !== undefined) question.content = content;
    if (type !== undefined) question.type = type;
    if (score !== undefined) question.score = score;

    if (examId !== undefined) {
      const exam = await this.examRepo.findOne({ where: { id: examId } });
      if (!exam) throw new NotFoundException('Exam không tồn tại');
      question.exam = exam;
    }

    if (subjectId !== undefined) {
      const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
      if (!subject) throw new NotFoundException('Subject không tồn tại');
      question.subject = subject;
    }

    if (topicId !== undefined) {
      const topic = await this.topicRepo.findOne({ where: { id: topicId } });
      if (!topic) throw new NotFoundException('Topic không tồn tại');
      question.topic = topic;
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
