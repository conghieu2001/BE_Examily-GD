import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Brackets, DeepPartial, Repository, ReturnDocument } from 'typeorm';
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
    @InjectRepository(User) private userRepo: Repository<User>,
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
        subjectId,
        topicId,
        levelId,
        classId,
      } = createQuestionDto;

      // Tìm các entity liên quan
      const typeQuestion = await this.typeQuestionRepo.findOne({ where: { id: typeQuestionId } });

      if (!typeQuestion) {
        throw new BadRequestException('TypeQuestion không tồn tại');
      }

      if (typeQuestion.name === 'multiple_choice') {
        const level = await this.levelRepo.findOne({ where: { id: levelId } });
        const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
        const topic = await this.topicRepo.findOne({ where: { id: topicId } });
        const checkclass = await this.classRepo.findOne({ where: { id: classId } });
        const mc = await this.multipeChoiceRepo.findOne({ where: { id: multipleChoiceId } });

        if (!level || !subject || !topic || !checkclass || !mc) {
          throw new BadRequestException('Level, Subject, Topic, Level, TypeQuestion không tồn tại');
        }
        // Tạo câu hỏi
        const newQuestion = this.questionRepo.create({
          content,
          typeQuestion,
          multipleChoice: mc,
          subject,
          topic,
          level,
          class: checkclass,
          createdBy: user,
        } as DeepPartial<Question>);
        const question = await this.questionRepo.save(newQuestion);
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
      } else {
        // Tạo câu hỏi
        const newQuestion = this.questionRepo.create({
          content,
          typeQuestion,
          multipleChoice: undefined,
          subject: undefined,
          topic: undefined,
          level: undefined,
          class: undefined,
          answers: undefined,
          createdBy: user,
        });
        const question = await this.questionRepo.save(newQuestion);
        return question;
      }


    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Tạo câu hỏi thất bại');
    }

  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Question> & { createdById?: number },
    user: User,
  ): Promise<PageDto<Question>> {
    // console.log(user)
    if (!user.classes || !user.subjects) {
      const fullUser = await this.userRepo.findOne({
        where: { id: user.id },
        relations: ['classes', 'subjects'],
      });

      if (!fullUser) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      user = fullUser;
    }
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
    const paginationKeys = paginationKeyword;

    // 🔐 Điều kiện truy cập: là người tạo HOẶC public và cùng lớp + môn
    queryBuilder.andWhere(
      new Brackets(qb => {
        qb.where('createdBy.id = :userId', { userId: user.id })
          .orWhere(new Brackets(qb2 => {
            qb2.where('question.isPublic = true')
              .andWhere('class.id IN (:...classIds)', {
                classIds: user.classes?.map(c => c.id) || [-1],
              })
              .andWhere('subject.id IN (:...subjectIds)', {
                subjectIds: user.subjects?.map(s => s.id) || [-1],
              });
          }));
      })
    );
    // 📌 Lọc các trường khác
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key) && query[key] !== undefined) {
          if (key === 'typeQuestionId') {
            queryBuilder.andWhere('typeQuestion.id = :typeQuestionId', {
              typeQuestionId: query[key],
            });
          } else if (key === 'createdById') {
            queryBuilder.andWhere('createdBy.id = :createdById', {
              createdById: query[key],
            });
          } else {
            queryBuilder.andWhere(`question.${key} = :${key}`, {
              [key]: query[key],
            });
          }
        }
      }
    }

    // 🔍 Tìm kiếm theo nội dung
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(question.content)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // 📦 Phân trang & sắp xếp
    queryBuilder.orderBy('question.id', order);
    queryBuilder.skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();

    // ✅ Sắp xếp answer theo id
    for (const question of items) {
      if (Array.isArray(question.answers)) {
        question.answers.sort((a, b) => a.id - b.id);
      }
    }

    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number): Promise<ItemDto<Question>> {

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
      order: { id: 'ASC' },
    });

    return new ItemDto(question);
  }
  async update(id: number, updateDto: UpdateQuestionDto, user: User) {
    // console.log(id, user)
    console.log(id)
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy', 'subject', 'topic', 'level', 'class', 'answers'],
    });
    // console.log(question)
    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }
    if (!(user && (user.isAdmin === true || question.createdBy?.id === user.id))) {
      throw new ForbiddenException('Bạn không có quyền cập nhật câu hỏi này');
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
      question.answers.sort((a, b) => a.id - b.id);
      for (let i = 0; i < answers.length; i++) {
        const a = answers[i] as any
        const answer = question.answers[i]
        // console.log(a, answer)
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
  async remove(id: number, user: User): Promise<ItemDto<Question>> {
    const checkQuestion = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!checkQuestion) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }
    if (!(user && (user.role === 'admin' || checkQuestion.createdBy?.id === user.id))) {
      throw new ForbiddenException('Bạn không có quyền xóa câu hỏi này');
    }
    await this.questionRepo.remove(checkQuestion);
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
  async cloneQuestion(questionId: number, user: User): Promise<Question> {
    try {
      // 1. Tìm câu hỏi gốc và các liên kết
      const originalQuestion = await this.questionRepo.findOne({
        where: { id: questionId },
        relations: [
          'answers',
          'typeQuestion',
          'multipleChoice',
          'subject',
          'topic',
          'level',
          'class',
        ],
      });

      if (!originalQuestion) {
        throw new NotFoundException('Không tìm thấy câu hỏi để nhân bản');
      }

      // 2. Clone câu hỏi
      const clonedQuestion = this.questionRepo.create({
        content: originalQuestion.content,
        typeQuestion: originalQuestion.typeQuestion,
        multipleChoice: originalQuestion.multipleChoice,
        subject: originalQuestion.subject,
        topic: originalQuestion.topic,
        level: originalQuestion.level,
        class: originalQuestion.class,
        createdBy: user,
      });

      const savedClonedQuestion = await this.questionRepo.save(clonedQuestion);

      // 3. Clone các câu trả lời (nếu có)
      if (originalQuestion.answers && originalQuestion.answers.length > 0) {
        for (const answer of originalQuestion.answers) {
          await this.answerService.create({
            content: answer.content,
            isCorrect: answer.isCorrect,
            questionId: savedClonedQuestion.id,
          }, user);
        }
      }

      return savedClonedQuestion;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Clone câu hỏi thất bại');
    }
  }
  async updateIsPublicToggle(id: number, user: User): Promise<ItemDto<Question>> {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!question) {
      throw new NotFoundException(`Không tìm thấy Question với ID: ${id}`);
    }

    // Chỉ admin hoặc người tạo câu hỏi mới được phép cập nhật
    if (!(user && (user.isAdmin || question.createdBy?.id === user.id))) {
      throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái công khai của câu hỏi này');
    }

    // Đảo ngược trạng thái isPublic
    question.isPublic = !question.isPublic;

    const updated = await this.questionRepo.save(question);
    return new ItemDto(updated);
  }
}
