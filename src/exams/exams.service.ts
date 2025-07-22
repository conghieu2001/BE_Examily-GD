import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { format, sub } from 'date-fns';
import { Class } from 'src/classes/entities/class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { QuestionScore } from 'src/question-score/entities/question-score.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { QuestionCloneService } from 'src/question-clone/question-clone.service';
import { CreateQuestionCloneDto } from 'src/question-clone/dto/create-question-clone.dto';
import { AnswerClone } from 'src/answer-clone/entities/answer-clone.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(AnswerClone)
    private readonly answerCloneRepo: Repository<AnswerClone>,
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
    private readonly questionCloneService: QuestionCloneService,
  ) { }

  async create(createExamDto: CreateExamDto, user: User) {
    const {
      title,
      description,
      durationMinutes,
      questionClones = [],
      questionScores = [],
      totalEssayScore,
      totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII,
      classId,
      subjectId,
    } = createExamDto;

    // Kiểm tra trùng tiêu đề
    const existing = await this.examRepo.findOne({ where: { title } });
    if (existing) {
      throw new BadRequestException('Tiêu đề đã tồn tại');
    }

    // Kiểm tra tổng điểm tự luận hợp lệ
    if (questionScores?.length > 0) {
      const totalEssayScoreSum = questionScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
      if (totalEssayScoreSum > totalEssayScore) {
        throw new BadRequestException(
          `Tổng điểm câu hỏi tự luận (${totalEssayScoreSum}) vượt quá tổng điểm cho phép (${totalEssayScore})`
        );
      }
    }

    // Lấy thông tin lớp học và môn học nếu có
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

    // Tạo đề thi ban đầu
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

    const savedExam = await this.examRepo.save(exam);

    // Nếu có QuestionClone thì tạo và liên kết với Exam
    if (questionClones.length > 0) {
      // Gom câu hỏi theo multipleChoiceId
      const groupMap = new Map<number, CreateQuestionCloneDto[]>();

      for (const qc of questionClones) {
        if (!qc.multipleChoiceId) continue; // Bỏ qua nếu không có nhóm
        const group = groupMap.get(qc.multipleChoiceId) || [];
        group.push(qc);
        groupMap.set(qc.multipleChoiceId, group);
      }

      // Tổng điểm theo nhóm multipleChoice
      const scoreMap: Record<number, number> = {
        1: totalMultipleChoiceScorePartI,
        2: totalMultipleChoiceScorePartII,
        3: totalMultipleChoiceScorePartIII,
      };

      const createdClones: QuestionClone[] = [];

      for (const [mcId, group] of groupMap.entries()) {
        const totalScore = scoreMap[mcId] ?? 0;
        const perScore = group.length > 0 ? +(totalScore / group.length).toFixed(2) : 0;

        for (const qcDto of group) {
          const cloneToCreate = { ...qcDto, score: perScore };
          const createdClone = await this.questionCloneService.create(cloneToCreate, user);
          createdClones.push(createdClone);
        }
      }

      savedExam.questionclones = createdClones;
      await this.examRepo.save(savedExam);
    }


    // Nếu có câu hỏi tự luận thì tạo và liên kết điểm
    if (questionScores?.length > 0) {
      const typeQuestion = await this.typeQuestionRepo.findOne({ where: { name: 'essay' } });
      const essayClones: QuestionClone[] = [];
      if (typeQuestion) {
        for (const qs of questionScores) {
          const newQuestionCloneEssay: CreateQuestionCloneDto = {
            content: qs.content,
            typeQuestionId: typeQuestion.id,
            score: qs.score,
            answerclones: [], // hoặc undefined cũng được
            multipleChoiceId: undefined,
            topicId: undefined,
            levelId: undefined,
          };
          const savedQuestion = await this.questionCloneService.create(newQuestionCloneEssay, user);
          essayClones.push(savedQuestion);
        }
        savedExam.questionclones = [
          ...(savedExam.questionclones || []),
          ...essayClones,
        ];

        await this.examRepo.save(savedExam);
      }
    }

    return savedExam;
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Exam> & { createdById?: number },
    user: User,
  ): Promise<PageDto<Exam>> {
    const queryBuilder = this.examRepo
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.class', 'class')
      .leftJoinAndSelect('exam.subject', 'subject')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .leftJoinAndSelect('exam.questionclones', 'questionclones')
      .leftJoinAndSelect('questionclones.topic', 'topic')
      .leftJoinAndSelect('questionclones.answerclones', 'answerclones')
      .leftJoinAndSelect('questionclones.typeQuestion', 'typeQuestion')
      .leftJoinAndSelect('questionclones.level', 'level')
      .leftJoinAndSelect('questionclones.multipleChoice', 'multipleChoice')
    // .leftJoinAndSelect('exam.questionScores', 'questionScores')
    // .leftJoinAndSelect('questionScores.question', 'essayQuestion');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const { createdById, ...restQuery } = query;

    if (createdById !== undefined) {
      if (createdById === user.id) {
        // Trường hợp 1: là chính người tạo -> lấy tất cả bài thi của họ
        queryBuilder.andWhere('createdBy.id = :createdById', { createdById });
      } else {
        // Trường hợp 2: không phải người tạo -> chỉ lấy bài thi công khai
        queryBuilder.andWhere('createdBy.id = :createdById AND exam.isPublic = true', { createdById });
      }
    } else {
      // Trường hợp 3: không truyền createdById -> lấy bài công khai hoặc của chính user
      queryBuilder.andWhere('(exam.isPublic = true OR createdBy.id = :userId)', { userId: user.id });
    }

    // Các điều kiện khác ngoài createdById
    const paginationKeys = paginationKeyword;
    for (const key of Object.keys(restQuery)) {
      if (!paginationKeys.includes(key)) {
        queryBuilder.andWhere(`exam.${key} = :${key}`, { [key]: restQuery[key] });
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
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: [
        'createdBy',
        'class',
        'subject',
        'questionclones',
        'questionclones.typeQuestion',
        'questionclones.topic',
        'questionclones.level',
        'questionclones.multipleChoice',
        'questionclones.answerclones',
      ],
    });

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy Exam với ID: ${id}`);
    }

    return new ItemDto(exam);
  }
  async update(id: number, updateExamDto: UpdateExamDto, user: User, rawQuestionClones: any[]) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: [
        'createdBy',
        'class',
        'subject',
        'questionclones',
        'questionclones.typeQuestion',
        'questionclones.topic',
        'questionclones.level',
        'questionclones.multipleChoice',
        'questionclones.answerclones',
      ],
    });
    // console.log(exam?.questionclones)
    if (!exam) throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    // console.log(rawQuestionClones)
    const {
      title,
      description,
      durationMinutes,
      questionClones = [],
      classId,
      subjectId,
      totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII,
      totalEssayScore,
    } = updateExamDto;
    let classEntity: Class | null = null;
    if (classId) {
      classEntity = await this.classRepo.findOne({ where: { id: classId } });
      if (!classEntity) throw new NotFoundException('Lớp không tồn tại');
      exam.class = classEntity
    }

    let subjectEntity: Subject | null = null;
    if (subjectId) {
      subjectEntity = await this.subjectRepo.findOne({ where: { id: subjectId } });
      if (!subjectEntity) throw new NotFoundException('Môn học không tồn tại');
      exam.subject = subjectEntity
    }
    // Cập nhật thông tin cơ bản
    if (title !== undefined) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (durationMinutes !== undefined) exam.durationMinutes = durationMinutes;
    if (totalMultipleChoiceScore !== undefined) exam.totalMultipleChoiceScore = totalMultipleChoiceScore;
    if (totalMultipleChoiceScorePartI !== undefined) exam.totalMultipleChoiceScorePartI = totalMultipleChoiceScorePartI;
    if (totalMultipleChoiceScorePartII !== undefined) exam.totalMultipleChoiceScorePartII = totalMultipleChoiceScorePartII;
    if (totalMultipleChoiceScorePartIII !== undefined) exam.totalMultipleChoiceScorePartIII = totalMultipleChoiceScorePartIII;
    if (totalEssayScore !== undefined) exam.totalEssayScore = totalEssayScore;

    const currentQuestionClones = Array.isArray(exam.questionclones) ? exam.questionclones : [];
    const currentIds = currentQuestionClones.map(q => q.id);

    const updatedQuestionClones = Array.isArray(rawQuestionClones) ? rawQuestionClones : [];
    const updatedIds = updatedQuestionClones.filter(q => q.id).map(q => q.id);

    const idsToRemove = currentIds.filter(id => !updatedIds.includes(id));

    // Xoá câu hỏi không còn trong danh sách gửi lên
    exam.questionclones = currentQuestionClones.filter(q => updatedIds.includes(q.id));
    await this.examRepo.save(exam);

    if (rawQuestionClones.length > 0) {
      for (const qc of rawQuestionClones) {
        if (qc.id) {
          const questioncloneToUpdate = {
            ...qc
          }
          // console.log(questioncloneToUpdate)
          const questioncloneUpdate = await this.questionCloneService.update(qc.id, questioncloneToUpdate, user)
        } else {
          const newQuestionClone = {
            ...qc,
            // exam
          }
          // console.log(newQuestionClone)
          const createdQuestion = await this.questionCloneService.create(newQuestionClone, user)
          console.log(createdQuestion)
          createdQuestion.exams = [exam];
          await this.questionCloneRepo.save(createdQuestion);
        }
      }
    }
    const updatedExam = await this.examRepo.findOne({
      where: { id: exam.id },
      relations: [
        'createdBy',
        'class',
        'subject',
        'questionclones',
        'questionclones.typeQuestion',
        'questionclones.topic',
        'questionclones.level',
        'questionclones.multipleChoice',
        'questionclones.answerclones',
      ],
    });

    return updatedExam;
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
  async clone(examId: number, user: User) {
    const exam = await this.examRepo.findOne({
      where: { id: examId },
      relations: [
        'questionclones',
        'questionclones.answerclones',
        'questionclones.typeQuestion',
        'questionclones.topic',
        'questionclones.level',
        'questionclones.multipleChoice',
        'class',
        'subject',
      ],
    });

    if (!exam) throw new NotFoundException('Không tìm thấy đề thi để clone');

    const clonedExam = this.examRepo.create({
      title: exam.title + ' (bản sao)',
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      totalEssayScore: exam.totalEssayScore,
      totalMultipleChoiceScore: exam.totalMultipleChoiceScore,
      totalMultipleChoiceScorePartI: exam.totalMultipleChoiceScorePartI,
      totalMultipleChoiceScorePartII: exam.totalMultipleChoiceScorePartII,
      totalMultipleChoiceScorePartIII: exam.totalMultipleChoiceScorePartIII,
      class: exam.class ?? undefined,
      subject: exam.subject ?? undefined,
      createdBy: user,
    });

    const savedExam = await this.examRepo.save(clonedExam);

    for (const qc of exam.questionclones) {
      const newQuestionClone = this.questionCloneRepo.create({
        content: qc.content,
        typeQuestion: qc.typeQuestion,
        topic: qc.topic,
        level: qc.level,
        score: qc.score,
        multipleChoice: qc.multipleChoice,
        createdBy: user,
        exams: [savedExam], // Chính xác, vì quan hệ là ManyToMany
      });

      const savedQuestionClone = await this.questionCloneRepo.save(newQuestionClone);

      for (const ac of qc.answerclones) {
        const newAnswerClone = this.answerCloneRepo.create({
          content: ac.content,
          isCorrect: ac.isCorrect,
          createdBy: user,
          questionclone: savedQuestionClone, // Chính xác, theo field bạn cần
        });

        await this.answerCloneRepo.save(newAnswerClone);
      }
    }

    return savedExam;
  }
  async toggleIsPublic(id: number, user: User | null): Promise<Exam> {
    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
    }

    if (!exam.createdBy || exam.createdBy.id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái bài thi này');
    }

    exam.isPublic = !exam.isPublic;

    return await this.examRepo.save(exam);
  }
}
