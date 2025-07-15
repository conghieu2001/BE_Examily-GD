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
import { format } from 'date-fns';
import { Class } from 'src/classes/entities/class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { QuestionScore } from 'src/question-score/entities/question-score.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(QuestionScore)
    private readonly questionScoreRepo: Repository<QuestionScore>,
    @InjectRepository(TypeQuestion)
    private readonly typeQuestionRepo: Repository<TypeQuestion>,
    @InjectRepository(QuestionClone)
    private readonly questionCloneRepo: Repository<QuestionClone>,
  ) { }

  async create(createExamDto: CreateExamDto, user: User) {
    const {
      title,
      description,
      durationMinutes,
      questionIds = [],
      questionScores = [],
      totalEssayScore,
      totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII,
      classId,
      subjectId,
    } = createExamDto;

    const existing = await this.examRepo.findOne({ where: { title } });
    if (existing) {
      throw new BadRequestException('Tiêu đề đã tồn tại');
    }
    // Kiểm tra tổng điểm câu hỏi tự luận
    if (questionScores?.length > 0) {
      const totalEssayScoreSum = questionScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
      if (totalEssayScoreSum > totalEssayScore) {
        throw new BadRequestException(
          `Tổng điểm câu hỏi tự luận (${totalEssayScoreSum}) vượt quá tổng điểm cho phép (${totalEssayScore})`
        );
      }
    }

    let classEntity: Class | null = null;
    if (classId) {
      classEntity = await this.classRepo.findOne({ where: { id: classId } });
      if (!classEntity) throw new NotFoundException('Lớp không tồn tại');
    }

    let subjectEntity: Subject | null = null;
    if (subjectId) {
      subjectEntity = await this.subjectRepo.findOne({ where: { id: subjectId } });
      if (!subjectEntity) throw new NotFoundException('Môn học không tồn tại');
    }

    const exam = this.examRepo.create({
      title,
      description,
      durationMinutes,
      totalEssayScore,
      totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII,
      class: classEntity ?? undefined,
      subject: subjectEntity ?? undefined,
      createdBy: user,
    });

    if (questionIds.length > 0) {
      const questions = await this.questionRepo.findBy({ id: In(questionIds) });
      exam.questions = questions;
    }
    const savedExam = await this.examRepo.save(exam);
    // Nếu có questionScores → tạo liên kết lưu điểm riêng
    if (questionScores?.length > 0) {
      const typeQuestion = await this.typeQuestionRepo.findOne({ where: { name: 'essay' } })
      if (typeQuestion) {
        for (const qs of questionScores) {
          // 1. Tạo câu hỏi tự luận
          const newQuestion = this.questionRepo.create({
            content: qs.content,
            typeQuestion: typeQuestion,
            createdBy: user,
          });

          const savedQuestion = await this.questionRepo.save(newQuestion);

          // 2. Tạo bản ghi QuestionScore
          const questionScore = this.questionScoreRepo.create({
            exam: savedExam,
            question: savedQuestion,
            score: qs.score,
          });

          await this.questionScoreRepo.save(questionScore);
        }
      }
    }

    return savedExam;
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Exam> & { createdById?: number },
  ): Promise<PageDto<Exam>> {
    const queryBuilder = this.examRepo
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.class', 'class')
      .leftJoinAndSelect('exam.subject', 'subject')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .leftJoinAndSelect('exam.questions', 'questions')
      .leftJoinAndSelect('questions.topic', 'topic')
      .leftJoinAndSelect('questions.answers', 'answers')
      .leftJoinAndSelect('questions.typeQuestion', 'typeQuestion')
      .leftJoinAndSelect('questions.level', 'level')
      .leftJoinAndSelect('questions.multipleChoice', 'multipleChoice')
      .leftJoinAndSelect('exam.questionScores', 'questionScores')
      .leftJoinAndSelect('questionScores.question', 'essayQuestion');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const pagination: string[] = paginationKeyword;

    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!pagination.includes(key)) {
          if (key === 'createdById') {
            queryBuilder.andWhere('createdBy.id = :createdById', { createdById: query[key] });
          } else {
            queryBuilder.andWhere(`exam.${key} = :${key}`, { [key]: query[key] });
          }
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
    const exam = await this.examRepo.findOne({ where: { id }, relations: ['createdBy', 'class', 'subject', 'questions', 'questions.answers', 'questions.typeQuestion', 'questions.class', 'questions.level', 'questions.multipleChoice', 'questionScores', 'questionScores.question'] });
    if (!exam) {
      throw new NotFoundException(`Không tìm thấy Exam với ID: ${id}`);
    }
    return new ItemDto(exam);
  }
  async update(id: number, updateExamDto: UpdateExamDto, user: User): Promise<Exam> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['createdBy', 'questions', 'questionScores', 'questionScores.question'],
    });

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }

    const {
      title,
      description,
      durationMinutes,
      questionIds,
      totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII,
      totalEssayScore,
      questionScores = []
    } = updateExamDto;

    if (title !== undefined) {
      exam.title = title;
    }

    if (description !== undefined) {
      exam.description = description;
    }

    if (durationMinutes !== undefined) {
      exam.durationMinutes = durationMinutes;
    }

    if (totalMultipleChoiceScore !== undefined) {
      exam.totalMultipleChoiceScore = totalMultipleChoiceScore;
    }

    if (totalMultipleChoiceScorePartI !== undefined) {
      exam.totalMultipleChoiceScorePartI = totalMultipleChoiceScorePartI;
    }

    if (totalMultipleChoiceScorePartII !== undefined) {
      exam.totalMultipleChoiceScorePartII = totalMultipleChoiceScorePartII;
    }

    if (totalMultipleChoiceScorePartIII !== undefined) {
      exam.totalMultipleChoiceScorePartIII = totalMultipleChoiceScorePartIII;
    }

    if (totalEssayScore !== undefined) {
      exam.totalEssayScore = totalEssayScore;
    }

    // ✅ Nếu truyền danh sách câu hỏi → cập nhật lại
    if (Array.isArray(questionIds)) {
      const questions = await this.questionRepo.findBy({ id: In(questionIds) });
      exam.questions = questions;
    }

    const savedExam = await this.examRepo.save(exam);

    const incomingIds = questionScores
      .map(qs => qs.questionId)
      .filter((id): id is number => typeof id === 'number');

    // Xoá các questionScores bị loại khỏi danh sách
    for (const old of exam.questionScores) {
      if (!incomingIds.includes(old.question.id)) {
        await this.questionScoreRepo.remove(old);
      }
    }

    const typeQuestion = await this.typeQuestionRepo.findOne({ where: { name: 'essay' } });
    if (!typeQuestion) throw new NotFoundException('Không tìm thấy loại câu hỏi essay');

    for (const qs of questionScores) {
      if (qs.questionId) {
        const question = await this.questionRepo.findOne({ where: { id: qs.questionId } });
        if (!question) throw new NotFoundException(`Không tìm thấy câu hỏi với ID ${qs.questionId}`);

        if (qs.content && qs.content !== question.content) {
          question.content = qs.content;
          await this.questionRepo.save(question);
        }

        const existing = exam.questionScores.find(x => x.question.id === qs.questionId);
        if (existing && existing.score !== qs.score) {
          existing.score = qs.score;
          await this.questionScoreRepo.save(existing);
        }
      } else {
        const newQuestion = this.questionRepo.create({
          content: qs.content,
          typeQuestion,
          createdBy: user,
        });
        const savedQuestion = await this.questionRepo.save(newQuestion);

        const newScore = this.questionScoreRepo.create({
          exam: savedExam,
          question: savedQuestion,
          score: qs.score,
        });
        await this.questionScoreRepo.save(newScore);
      }
    }

    return savedExam;
  }
  async remove(id: number): Promise<ItemDto<Exam>> {
    const checkExam = await this.examRepo.findOne({
      where: { id },
      relations: ['createdBy', 'course', 'questions'],
    });

    if (!checkExam) {
      throw new NotFoundException(`Không tìm thấy Exam với ID: ${id}`);
    }

    await this.examRepo.softRemove(checkExam);
    return new ItemDto(checkExam);
  }
  async clone(id: number, user: User): Promise<Exam> {
    const original = await this.examRepo.findOne({
      where: { id },
      relations: [
        'questions',
        'questionScores',
        'questionScores.question',
        'class',
        'subject',
        'createdBy',
      ],
    });

    if (!original) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }

    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
    const newTitle = `${original.title} - Bản sao (${timestamp})`;

    // 👉 Tạo exam mới
    const newExam = this.examRepo.create({
      title: newTitle,
      description: original.description,
      durationMinutes: original.durationMinutes,
      totalMultipleChoiceScore: original.totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI: original.totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII: original.totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII: original.totalMultipleChoiceScorePartIII,
      totalEssayScore: original.totalEssayScore,
      class: original.class,
      subject: original.subject,
      questions: original.questions,
      createdBy: user,
    });

    const savedExam = await this.examRepo.save(newExam);

    // 👉 Clone lại các questionScores nếu có
    for (const qs of original.questionScores) {
      const clonedScore = this.questionScoreRepo.create({
        exam: savedExam,
        question: qs.question,
        score: qs.score,
      });

      await this.questionScoreRepo.save(clonedScore);
    }

    return savedExam;
  }
}
