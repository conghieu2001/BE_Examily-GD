import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { Brackets, DataSource, DeepPartial, In, Repository } from 'typeorm';
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    private readonly dataSource: DataSource,
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

    // 1. Kiểm tra trùng tiêu đề
    const existing = await this.examRepo.findOne({ where: { title } });
    if (existing) {
      throw new BadRequestException('Tiêu đề đã tồn tại');
    }

    // 2. Kiểm tra tổng điểm tự luận
    if (questionScores?.length > 0) {
      const totalEssayScoreSum = questionScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
      if (totalEssayScoreSum > totalEssayScore) {
        throw new BadRequestException(
          `Tổng điểm câu hỏi tự luận (${totalEssayScoreSum}) vượt quá tổng điểm cho phép (${totalEssayScore})`
        );
      }
    }

    // 3. Lấy thông tin class / subject
    const classEntity = classId ? await this.classRepo.findOne({ where: { id: classId } }) : null;
    if (classId && !classEntity) throw new NotFoundException('Lớp không tồn tại');

    const subjectEntity = subjectId ? await this.subjectRepo.findOne({ where: { id: subjectId } }) : null;
    if (subjectId && !subjectEntity) throw new NotFoundException('Môn học không tồn tại');

    // 4. Lấy TypeQuestion essay nếu có
    const essayType = questionScores?.length
      ? await this.typeQuestionRepo.findOne({ where: { name: 'essay' } })
      : null;

    // 5. Transaction để đảm bảo tạo đồng bộ
    return await this.dataSource.transaction(async (manager) => {
      // 5.1. Tạo Exam
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
      const savedExam = await manager.getRepository(Exam).save(exam);

      // 5.2. Chuẩn bị dữ liệu QuestionClone
      const mcqCountsPerQuestion: number[] = questionClones.map(q => q.answerclones?.length || 0);

      // MCQ từ FE
      const toInsertMCQs = questionClones.map(qc => ({
        content: qc.content,
        score: qc.score ?? 0,
        typeQuestion: qc.typeQuestionId ? { id: qc.typeQuestionId } : undefined,
        multipleChoice: qc.multipleChoiceId ? { id: qc.multipleChoiceId } : undefined,
        topic: qc.topicId ? { id: qc.topicId } : undefined,
        level: qc.levelId ? { id: qc.levelId } : undefined,
        answerclonescount: qc.answerclones?.length ?? 0,
        createdBy: { id: user.id },
      }));

      // Essay từ questionScores
      const toInsertEssays = (questionScores || []).map(qs => ({
        content: qs.content,
        score: qs.score ?? 0,
        typeQuestion: essayType ? { id: essayType.id } : undefined,
        multipleChoice: undefined,
        topic: undefined,
        level: undefined,
        answerclonescount: 0,
        createdBy: { id: user.id },
      }));

      const allQuestionValues = [...toInsertMCQs, ...toInsertEssays];

      // 5.3. Insert QuestionClone hàng loạt
      let insertedQuestionIds: number[] = [];
      if (allQuestionValues.length > 0) {
        const insertQCRes = await manager
          .getRepository(QuestionClone)
          .createQueryBuilder()
          .insert()
          .values(allQuestionValues as any)
          .returning(['id'])
          .execute();

        insertedQuestionIds = insertQCRes.identifiers.map((it: any) => Number(it.id));
      }

      // 5.4. Gán QuestionClone vào Exam (ManyToMany)
      if (insertedQuestionIds.length > 0) {
        await manager
          .createQueryBuilder()
          .relation(Exam, 'questionclones')
          .of(savedExam.id)
          .add(insertedQuestionIds);
      }

      // 5.5. Insert AnswerClone hàng loạt
      const allAnswerValues: any[] = [];
      const mcqIds = insertedQuestionIds.slice(0, toInsertMCQs.length);

      for (let i = 0; i < questionClones.length; i++) {
        const qcId = mcqIds[i];
        const answers = questionClones[i].answerclones || [];
        for (const ans of answers) {
          allAnswerValues.push({
            content: ans.content,
            isCorrect: !!ans.isCorrect,
            questionclone: { id: qcId },
            createdBy: { id: user.id },
          });
        }
      }

      if (allAnswerValues.length > 0) {
        await manager
          .getRepository(AnswerClone)
          .createQueryBuilder()
          .insert()
          .values(allAnswerValues as any)
          .execute();
      }

      // 5.6. Trả về exam kèm quan hệ
      return await manager.getRepository(Exam).findOne({
        where: { id: savedExam.id },
        relations: [
          'class',
          'subject',
          'questionclones',
          'questionclones.answerclones',
          'questionclones.typeQuestion',
          'questionclones.multipleChoice',
          'questionclones.topic',
          'questionclones.level',
        ],
      });
    });
  }

  // async create(createExamDto: CreateExamDto, user: User) {
  //   const {
  //     title,
  //     description,
  //     durationMinutes,
  //     questionClones = [],
  //     questionScores = [],
  //     totalEssayScore,
  //     totalMultipleChoiceScore,
  //     totalMultipleChoiceScorePartI,
  //     totalMultipleChoiceScorePartII,
  //     totalMultipleChoiceScorePartIII,
  //     classId,
  //     subjectId,
  //   } = createExamDto;
  //   console.log(createExamDto)
  //   // Kiểm tra trùng tiêu đề
  //   const existing = await this.examRepo.findOne({ where: { title } });
  //   if (existing) {
  //     throw new BadRequestException('Tiêu đề đã tồn tại');
  //   }

  //   // Kiểm tra tổng điểm tự luận hợp lệ
  //   if (questionScores?.length > 0) {
  //     const totalEssayScoreSum = questionScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
  //     if (totalEssayScoreSum > totalEssayScore) {
  //       throw new BadRequestException(
  //         `Tổng điểm câu hỏi tự luận (${totalEssayScoreSum}) vượt quá tổng điểm cho phép (${totalEssayScore})`
  //       );
  //     }
  //   }

  //   // Lấy thông tin lớp học và môn học nếu có
  //   const classEntity = classId ? await this.classRepo.findOne({ where: { id: classId } }) : null;
  //   if (classId && !classEntity) throw new NotFoundException('Lớp không tồn tại');

  //   const subjectEntity = subjectId ? await this.subjectRepo.findOne({ where: { id: subjectId } }) : null;
  //   if (subjectId && !subjectEntity) throw new NotFoundException('Môn học không tồn tại');

  //   // Tạo đề thi ban đầu
  //   const exam = this.examRepo.create({
  //     title,
  //     description,
  //     durationMinutes,
  //     totalEssayScore,
  //     totalMultipleChoiceScore,
  //     totalMultipleChoiceScorePartI,
  //     totalMultipleChoiceScorePartII,
  //     totalMultipleChoiceScorePartIII,
  //     class: classEntity ?? undefined,
  //     subject: subjectEntity ?? undefined,
  //     createdBy: user,
  //   });

  //   const savedExam = await this.examRepo.save(exam);

  //   // Nếu có QuestionClone thì tạo và liên kết với Exam
  //   if (questionClones.length > 0) {
  //     const createdClones: QuestionClone[] = [];

  //     for (const qcDto of questionClones) {
  //       const cloneToCreate = { ...qcDto }; // giữ nguyên score từ FE
  //       const createdClone = await this.questionCloneService.create(cloneToCreate, user);
  //       createdClones.push(createdClone);
  //     }

  //     savedExam.questionclones = createdClones;
  //     await this.examRepo.save(savedExam);
  //   }

  //   // Nếu có câu hỏi tự luận thì tạo và liên kết
  //   if (questionScores?.length > 0) {
  //     const typeQuestion = await this.typeQuestionRepo.findOne({ where: { name: 'essay' } });
  //     if (typeQuestion) {
  //       const essayClones: QuestionClone[] = [];

  //       for (const qs of questionScores) {
  //         const newQuestionCloneEssay: CreateQuestionCloneDto = {
  //           content: qs.content,
  //           typeQuestionId: typeQuestion.id,
  //           score: qs.score,
  //           answerclones: [],
  //           multipleChoiceId: undefined,
  //           topicId: undefined,
  //           levelId: undefined,
  //         };
  //         const savedQuestion = await this.questionCloneService.create(newQuestionCloneEssay, user);
  //         essayClones.push(savedQuestion);
  //       }

  //       savedExam.questionclones = [
  //         ...(savedExam.questionclones || []),
  //         ...essayClones,
  //       ];

  //       await this.examRepo.save(savedExam);
  //     }
  //   }

  //   return savedExam;
  // }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Exam> & { createdById?: number },
    user: User,
    req
  ): Promise<PageDto<Exam>> {
    const fullUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['classes', 'subjects'],
    });
    if (!fullUser) throw new NotFoundException('Không tìm thấy người dùng');
    user = fullUser;

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
      .leftJoinAndSelect('questionclones.multipleChoice', 'multipleChoice');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const { createdById, ...restQuery } = query;

    queryBuilder.andWhere(
      new Brackets(qb => {
        const classIds = user.classes?.map(c => c.id) || [-1];
        const subjectIds = user.subjects?.map(s => s.id) || [-1];

        if (createdById && Number(createdById) === user.id) {
          qb.where('createdBy.id = :userId', { userId: user.id });
        } else if (createdById && Number(createdById) !== user.id) {
          qb.where('exam.isPublic = true')
            .andWhere('createdBy.id = :createdById', { createdById })
            .andWhere('class.id IN (:...classIds)', { classIds })
            .andWhere('subject.id IN (:...subjectIds)', { subjectIds });
        } else {
          qb.where('createdBy.id = :userId', { userId: user.id }).orWhere(
            new Brackets(qb2 => {
              qb2.where('exam.isPublic = true')
                .andWhere('class.id IN (:...classIds)', { classIds })
                .andWhere('subject.id IN (:...subjectIds)', { subjectIds });
            })
          );
        }
      })
    );

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

    queryBuilder.orderBy('exam.id', order).skip(skip);
    if ('take' in req.query) {
      queryBuilder.take(take);
    }

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();

    // 👉 Sắp xếp các mảng con sau khi lấy ra từ DB
    for (const exam of items) {
      if (Array.isArray(exam.questionclones)) {
        exam.questionclones.sort((a, b) => a.id - b.id);
        for (const q of exam.questionclones) {
          if (Array.isArray(q.answerclones)) {
            q.answerclones.sort((a, b) => a.id - b.id);
          }
        }
      }
    }

    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number, user: User): Promise<ItemDto<Exam>> {
    if (!user) {
      console.log('không có user');
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }
    // console.log('hehe')
    const queryBuilder = this.examRepo.createQueryBuilder('exam')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .leftJoinAndSelect('exam.class', 'class')
      .leftJoinAndSelect('exam.subject', 'subject')
      .leftJoinAndSelect('exam.questionclones', 'questionclones')
      .leftJoinAndSelect('questionclones.typeQuestion', 'typeQuestion')
      .leftJoinAndSelect('questionclones.topic', 'topic')
      .leftJoinAndSelect('questionclones.createdBy', 'createdBy')
      .leftJoinAndSelect('questionclones.level', 'level')
      .leftJoinAndSelect('questionclones.multipleChoice', 'multipleChoice')
      .leftJoinAndSelect('questionclones.answerclones', 'answerclones')
      .where('exam.id = :id', { id })
      .orderBy('questionclones.id', 'ASC')
      .addOrderBy('answerclones.id', 'ASC');

    const exam = await queryBuilder.getOne();

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy Exam với ID: ${id}`);
    }

    return new ItemDto(exam);
  }
  // async update(id: number, updateExamDto: UpdateExamDto, user: User, rawQuestionClones: any[]) {
  //   // console.log(rawQuestionClones)
  //   if (!user) {
  //     console.log('không có user')
  //     throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
  //   }
  //   // console.log('1111')
  //   const exam = await this.examRepo.findOne({
  //     where: { id },
  //     relations: [
  //       'createdBy',
  //       'class',
  //       'subject',
  //       'questionclones',
  //       'questionclones.typeQuestion',
  //       'questionclones.topic',
  //       'questionclones.level',
  //       'questionclones.multipleChoice',
  //       'questionclones.answerclones',
  //     ],
  //   });
  //   // console.log(exam?.questionclones)
  //   if (!exam) throw new NotFoundException(`Không tìm thấy bài thi với ID: ${id}`);
  //   // console.log(rawQuestionClones)
  //   // console.log(exam)
  //   const {
  //     title,
  //     description,
  //     durationMinutes,
  //     questionClones = [],
  //     classId,
  //     subjectId,
  //     totalMultipleChoiceScore,
  //     totalMultipleChoiceScorePartI,
  //     totalMultipleChoiceScorePartII,
  //     totalMultipleChoiceScorePartIII,
  //     totalEssayScore,
  //   } = updateExamDto;
  //   if (exam.isCourseByExam) {
  //     return {
  //       message: 'Đề thi này đã có học sinh tham gia, không thể chỉnh sửa bất kì thông tin nào!'
  //     }
  //     // if (rawQuestionClones.length > 0) {
  //     //   for (const qc of rawQuestionClones) {
  //     //     console.log(qc)
  //     //     if (qc.id && Array.isArray(qc.answerclones)) {
  //     //       const existingQuestion = exam.questionclones.find(q => q.id === qc.id);
  //     //       if (existingQuestion && Array.isArray(existingQuestion.answerclones)) {
  //     //         for (const updatedAnswer of qc.answerclones) {
  //     //           const existingAnswer = existingQuestion.answerclones.find(a => a.id === updatedAnswer.id);
  //     //           if (existingAnswer) {
  //     //             existingAnswer.isCorrect = updatedAnswer.isCorrect;
  //     //             await this.answerCloneRepo.save(existingAnswer);

  //     //           }
  //     //         }
  //     //       }
  //     //     }
  //     //   }

  //     //   // Save lại exam để lưu thay đổi isCorrect của answerclones
  //     //   await this.examRepo.save(exam);
  //     // }

  //     // const updatedExam = await this.examRepo.save(exam);
  //     // return {
  //     //   updatedExam,
  //     //   message: 'heheheheh'
  //     // };
  //   } else {
  //     // console.log('1111')
  //     if (classId !== undefined) {
  //       if (classId) {
  //         const classEntity = await this.classRepo.findOne({ where: { id: classId } });
  //         if (!classEntity) throw new NotFoundException('Lớp không tồn tại');
  //         exam.class = classEntity;
  //       }
  //     }
  //     // else: không làm gì => giữ nguyên

  //     if (subjectId !== undefined) {
  //       if (subjectId) {
  //         const subjectEntity = await this.subjectRepo.findOne({ where: { id: subjectId } });
  //         if (!subjectEntity) throw new NotFoundException('Môn học không tồn tại');
  //         exam.subject = subjectEntity;
  //       }
  //     }
  //     // Cập nhật thông tin cơ bản
  //     if (title !== undefined) exam.title = title;
  //     if (description !== undefined) exam.description = description;
  //     if (durationMinutes !== undefined) exam.durationMinutes = durationMinutes;
  //     if (totalMultipleChoiceScore !== undefined) exam.totalMultipleChoiceScore = totalMultipleChoiceScore;
  //     if (totalMultipleChoiceScorePartI !== undefined) exam.totalMultipleChoiceScorePartI = totalMultipleChoiceScorePartI;
  //     if (totalMultipleChoiceScorePartII !== undefined) exam.totalMultipleChoiceScorePartII = totalMultipleChoiceScorePartII;
  //     if (totalMultipleChoiceScorePartIII !== undefined) exam.totalMultipleChoiceScorePartIII = totalMultipleChoiceScorePartIII;
  //     if (totalEssayScore !== undefined) exam.totalEssayScore = totalEssayScore;

  //     const currentQuestionClones = Array.isArray(exam.questionclones) ? exam.questionclones : [];
  //     const currentIds = currentQuestionClones.map(q => q.id);

  //     const updatedQuestionClones = Array.isArray(rawQuestionClones) ? rawQuestionClones : [];
  //     const updatedIds = updatedQuestionClones.filter(q => q.id).map(q => q.id);

  //     const idsToRemove = currentIds.filter(id => !updatedIds.includes(id));

  //     // Xoá câu hỏi không còn trong danh sách gửi lên
  //     exam.questionclones = currentQuestionClones.filter(q => updatedIds.includes(q.id));
  //     await this.examRepo.save(exam);
  //     // let aaa = 0
  //     if (rawQuestionClones.length > 0) {
  //       for (const qc of rawQuestionClones) {
  //         // console.log(qc)
  //         // aaa++

  //         if (qc.id) {
  //           const questioncloneToUpdate = {
  //             ...qc
  //           }
  //           await this.questionCloneService.update(qc.id, questioncloneToUpdate, user);
  //         } else {
  //           const newQuestionClone = {
  //             ...qc,
  //           };
  //           const createdQuestion = await this.questionCloneService.create(newQuestionClone, user);

  //           // Gán vào exam.questions
  //           if (!exam.questionclones) exam.questionclones = [];
  //           exam.questionclones.push(createdQuestion);
  //         }
  //       }
  //       // console.log(aaa)

  //       // Save lại exam để lưu quan hệ
  //       await this.examRepo.save(exam);
  //     }

  //     const updatedExam = await this.examRepo.save(exam);
  //     // console.log('xong')
  //     return updatedExam;
  //   }

  // }
  async update(id: number, updateExamDto: UpdateExamDto, user: User, rawQuestionClones: any[]) {

    // console.log('1111')
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: [
        'createdBy',
        'class',
        'subject',
        'questionclones',
        'questionclones.createdBy',
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
    // console.log(exam)
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
    if (exam.isCourseByExam) {
      return {
        message: 'Đề thi này đã có học sinh tham gia, không thể chỉnh sửa bất kì thông tin nào!'
      }
    } else {
      // console.log('1111')
      if (classId !== undefined) {
        if (classId) {
          const classEntity = await this.classRepo.findOne({ where: { id: classId } });
          if (!classEntity) throw new NotFoundException('Lớp không tồn tại');
          exam.class = classEntity;
        }
      }
      // else: không làm gì => giữ nguyên

      if (subjectId !== undefined) {
        if (subjectId) {
          const subjectEntity = await this.subjectRepo.findOne({ where: { id: subjectId } });
          if (!subjectEntity) throw new NotFoundException('Môn học không tồn tại');
          exam.subject = subjectEntity;
        }
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


      // Xoá câu hỏi không còn trong danh sách gửi lên
      await this.examRepo.save(exam);
      if (rawQuestionClones.length > 0) {
        for (const qc of rawQuestionClones) {
          if (qc.id) {
            // console.log(qc)
            if (qc.isUpdate) {
              // console.log(qc)
              const { isUpdate, ...questioncloneToUpdate } = qc;
              await this.questionCloneService.update(qc.id, questioncloneToUpdate, user);
            } else if (qc.isDelete) {
              exam.questionclones = exam.questionclones.filter(qcItem => qcItem.id !== qc.id);
            }

          } else {
            const newQuestionClone = {
              ...qc,
            };
            const createdQuestion = await this.questionCloneService.create(newQuestionClone, user);

            // Gán vào exam.questions
            if (!exam.questionclones) exam.questionclones = [];
            exam.questionclones.push(createdQuestion);
          }
        }

        // Save lại exam để lưu quan hệ
        await this.examRepo.save(exam);
      }

      // --- Cập nhật điểm cho từng câu hỏi theo phần ---
      exam.questionclones.forEach(q => {
        if (q.multipleChoice?.name === 'Phần I') q.score = (totalMultipleChoiceScorePartI || 0) / exam.questionclones.filter(x => x.multipleChoice?.name === 'Phần I').length;
        else if (q.multipleChoice?.name === 'Phần II') q.score = (totalMultipleChoiceScorePartII || 0) / exam.questionclones.filter(x => x.multipleChoice?.name === 'Phần II').length;
        else if (q.multipleChoice?.name === 'Phần III') q.score = (totalMultipleChoiceScorePartIII || 0) / exam.questionclones.filter(x => x.multipleChoice?.name === 'Phần III').length;
        else if (q.typeQuestion?.name === 'ESSAY') q.score = (totalEssayScore || 0) / exam.questionclones.filter(x => x.typeQuestion?.name === 'ESSAY').length;
      });

      // --- Lưu exam cuối cùng cùng với điểm ---
      await this.questionCloneRepo.save(exam.questionclones); // lưu điểm câu hỏi
      const updatedExam = await this.examRepo.save(exam);

      return updatedExam;
    }

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
    if (!user) {
      console.log('không có user')
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }
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
      console.log('không có user')
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
  async findAllExamReal(
    pageOptions: PageOptionsDto,
    query: Partial<Exam> & { createdById?: number },
    user: User,
    req,
  ): Promise<PageDto<Exam>> {
    const fullUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['classes', 'subjects'],
    });
    if (!fullUser) throw new NotFoundException('Không tìm thấy người dùng');
    user = fullUser;

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
      .leftJoin('course_by_exam', 'courseByExam', 'courseByExam.examId = exam.id') // 👈 JOIN thêm bảng trung gian
      .where('courseByExam.id IS NULL'); // 👈 Lọc những exam chưa được dùng

    const { skip, take, order = 'ASC', search } = pageOptions;
    const { createdById, ...restQuery } = query;

    queryBuilder.andWhere(
      new Brackets(qb => {
        const classIds = user.classes?.map(c => c.id) || [-1];
        const subjectIds = user.subjects?.map(s => s.id) || [-1];

        if (createdById && Number(createdById) === user.id) {
          qb.where('createdBy.id = :userId', { userId: user.id });
        } else if (createdById && Number(createdById) !== user.id) {
          qb.where('exam.isPublic = true')
            .andWhere('createdBy.id = :createdById', { createdById })
            .andWhere('class.id IN (:...classIds)', { classIds })
            .andWhere('subject.id IN (:...subjectIds)', { subjectIds });
        } else {
          qb.where('createdBy.id = :userId', { userId: user.id }).orWhere(
            new Brackets(qb2 => {
              qb2.where('exam.isPublic = true')
                .andWhere('class.id IN (:...classIds)', { classIds })
                .andWhere('subject.id IN (:...subjectIds)', { subjectIds });
            })
          );
        }
      })
    );

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

    queryBuilder.orderBy('exam.id', order).skip(skip);
    if ('take' in req.query) {
      queryBuilder.take(take);
    }

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();

    for (const exam of items) {
      if (Array.isArray(exam.questionclones)) {
        exam.questionclones.sort((a, b) => a.id - b.id);
        for (const q of exam.questionclones) {
          if (Array.isArray(q.answerclones)) {
            q.answerclones.sort((a, b) => a.id - b.id);
          }
        }
      }
    }

    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    return new PageDto(items, pageMetaDto);
  }
  // async cloneByExanOrigin(examId: number, name: string, user: User) {
  //   if (!user) {
  //     console.log('không có user')
  //     throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
  //   }
  //   const exam = await this.examRepo.findOne({
  //     where: { id: examId },
  //     relations: [
  //       'questionclones',
  //       'questionclones.answerclones',
  //       'questionclones.typeQuestion',
  //       'questionclones.topic',
  //       'questionclones.level',
  //       'questionclones.multipleChoice',
  //       'class',
  //       'subject',
  //     ],
  //   });

  //   if (!exam) throw new NotFoundException('Không tìm thấy đề thi để clone');

  //   const clonedExam = this.examRepo.create({
  //     title: exam.title + `(${name})`,
  //     description: exam.description,
  //     durationMinutes: exam.durationMinutes,
  //     totalEssayScore: exam.totalEssayScore,
  //     totalMultipleChoiceScore: exam.totalMultipleChoiceScore,
  //     totalMultipleChoiceScorePartI: exam.totalMultipleChoiceScorePartI,
  //     totalMultipleChoiceScorePartII: exam.totalMultipleChoiceScorePartII,
  //     totalMultipleChoiceScorePartIII: exam.totalMultipleChoiceScorePartIII,
  //     class: exam.class ?? undefined,
  //     subject: exam.subject ?? undefined,
  //     createdBy: user,
  //   });

  //   const savedExam = await this.examRepo.save(clonedExam);

  //   for (const qc of exam.questionclones) {
  //     const newQuestionClone = this.questionCloneRepo.create({
  //       content: qc.content,
  //       typeQuestion: qc.typeQuestion,
  //       topic: qc.topic,
  //       level: qc.level,
  //       score: qc.score,
  //       multipleChoice: qc.multipleChoice,
  //       createdBy: user,
  //       exams: [savedExam], // Chính xác, vì quan hệ là ManyToMany
  //     });

  //     const savedQuestionClone = await this.questionCloneRepo.save(newQuestionClone);

  //     for (const ac of qc.answerclones) {
  //       const newAnswerClone = this.answerCloneRepo.create({
  //         content: ac.content,
  //         isCorrect: ac.isCorrect,
  //         createdBy: user,
  //         questionclone: savedQuestionClone, // Chính xác, theo field bạn cần
  //       });

  //       await this.answerCloneRepo.save(newAnswerClone);
  //     }
  //   }

  //   return savedExam;
  // }
  async cloneByExanOrigin(examId: number, name: string, user: User) {
    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

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
        'createdBy'
      ],
    });

    if (!exam) throw new NotFoundException('Không tìm thấy đề thi để clone');

    return await this.examRepo.manager.transaction(async (manager) => {
      // 1️⃣ Tạo exam mới
      const examInsertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Exam)
        .values({
          title: exam.title + `(${name})`,
          description: exam.description,
          durationMinutes: exam.durationMinutes,
          totalEssayScore: exam.totalEssayScore,
          totalMultipleChoiceScore: exam.totalMultipleChoiceScore,
          totalMultipleChoiceScorePartI: exam.totalMultipleChoiceScorePartI,
          totalMultipleChoiceScorePartII: exam.totalMultipleChoiceScorePartII,
          totalMultipleChoiceScorePartIII: exam.totalMultipleChoiceScorePartIII,
          class: exam.class ?? null,
          subject: exam.subject ?? null,
          createdBy: user,
        })
        .execute();

      const newExamId = examInsertResult.identifiers[0].id;

      // 2️⃣ Chuẩn bị dữ liệu QuestionClone
      const questionCloneData = exam.questionclones.map((qc) => ({
        content: qc.content,
        typeQuestion: qc.typeQuestion ?? null,
        topic: qc.topic ?? null,
        level: qc.level ?? null,
        score: qc.score,
        multipleChoice: qc.multipleChoice ?? null,
        createdBy: user,
      }));

      // Insert QuestionClone
      const questionInsertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(QuestionClone)
        .values(questionCloneData)
        .execute();

      const newQuestionIds = questionInsertResult.identifiers.map((id) => id.id);

      // 3️⃣ Tạo quan hệ exam - questionclone (ManyToMany)
      const examQuestionRelations = newQuestionIds.map((qid) => ({
        examId: newExamId,
        questionCloneId: qid,
      }));
      await manager
        .createQueryBuilder()
        .insert()
        .into('exam_questionclones_question_clone') // tên bảng join
        .values(examQuestionRelations)
        .execute();

      // 4️⃣ Chuẩn bị dữ liệu AnswerClone
      const answerCloneData: DeepPartial<AnswerClone>[] = [];
      exam.questionclones.forEach((qc, index) => {
        const newQid = newQuestionIds[index];
        qc.answerclones.forEach((ac) => {
          answerCloneData.push({
            content: ac.content,
            isCorrect: ac.isCorrect,
            createdBy: user,
            questionclone: { id: newQid }
          });
        });
      });

      // Insert AnswerClone
      if (answerCloneData.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(AnswerClone)
          .values(answerCloneData)
          .execute();
      }

      // 5️⃣ Trả về full exam đã clone
      return await manager.findOne(Exam, {
        where: { id: newExamId },
        relations: [
          'questionclones',
          'questionclones.answerclones',
          'questionclones.typeQuestion',
          'questionclones.topic',
          'questionclones.level',
          'questionclones.multipleChoice',
          'class',
          'subject',
          'createdBy'
        ],
      });
    });
  }

}
