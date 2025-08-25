import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamSession } from './entities/exam-session.entity';
import { In, Repository } from 'typeorm';
import { CourseByExam, statusExam } from 'src/course-by-exams/entities/course-by-exam.entity';
import { User } from 'src/users/entities/user.entity';
import { SubmitAnswer } from 'src/submit-answer/entities/submit-answer.entity';
import { Question } from 'src/questions/entities/question.entity';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { error } from 'console';

@Injectable()
export class ExamSessionService {
  constructor(
    @InjectRepository(ExamSession) private examsessionRepo: Repository<ExamSession>,
    @InjectRepository(CourseByExam) private courseByExamRepo: Repository<CourseByExam>,
    @InjectRepository(SubmitAnswer) private submitAnswerRepo: Repository<SubmitAnswer>,
    @InjectRepository(QuestionClone) private questionCloneRepo: Repository<QuestionClone>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }
  async saveMultipleAnswers(
    sessionId: number,
    answers: {
      questionId: number;
      selectedOption?: number[];
      selectedPairs?: { id: number; content: string; isCorrect: boolean }[];
      essayAnswer?: string;
      order?: number;
    }[],
    user: User,
  ) {
    // console.log(user)
    const session = await this.examsessionRepo.findOne({
      where: { id: sessionId },
      relations: ['createdBy'],
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên làm bài');

    const questionIds = answers.map(a => a.questionId);
    const questions = await this.questionCloneRepo.find({
      where: { id: In(questionIds) },
      relations: ['multipleChoice',],
    });
    const questionMap = new Map<number, QuestionClone>();
    questions.forEach(q => questionMap.set(q.id, q));
    // const creator = await this.userRepo.findOne({ where: { id: user.id } });
    for (const answerData of answers) {
      const question = questionMap.get(answerData.questionId);
      if (!question) continue;

      const existingAnswer = await this.submitAnswerRepo.findOne({
        where: {
          session: { id: sessionId },
          questionclone: { id: question.id },
        },
      });
      // console.log(existingAnswer)
      const commonFields = {
        order: answerData.order ?? 0,
        createdBy: user
      };

      let data: any = { ...commonFields };
      const part = question.multipleChoice?.name;

      if (part === 'Phần I') {
        // console.log(1)
        data.selectedOption = answerData.selectedOption || [];
      } else if (part === 'Phần II') {
        // console.log(2)
        data.selectedPairs = answerData.selectedPairs || [];
      } else if (part === 'Phần III' || question.typeQuestion === TypeQuestion.ESSAY) {
        // console.log(3)
        data.essayAnswer = answerData.essayAnswer?.trim() || '';
      }

      if (existingAnswer) {
        this.submitAnswerRepo.merge(existingAnswer, data);
        // console.log(user)
        await this.submitAnswerRepo.save(existingAnswer);
      } else {
        const newAnswer = await this.submitAnswerRepo.save({
          session,
          questionclone: question,
          ...data,
        });
        // await this.submitAnswerRepo.save(newAnswer);
        // console.log(newAnswer)
      }
    }
    return { success: true };
  }
  async submitExam(
    sessionId: number,
    answers: {
      questionId: number;
      selectedOption?: number[];
      selectedPairs?: { id: number; content: string; isCorrect: boolean }[];
      essayAnswer?: string;
      order?: number;
    }[],
    user: User
  ) {
    // console.log(answers)
    // Lưu câu trả lời
    await this.saveMultipleAnswers(sessionId, answers, user);

    // Lấy dữ liệu bài thi
    const session = await this.examsessionRepo.findOne({
      where: { id: sessionId },
      relations: [
        'createdBy',
        'answers',
        'answers.createdBy',
        'answers.questionclone',
        'answers.questionclone.multipleChoice',
        'answers.questionclone.answerclones',
        'courseByExam',
        'courseByExam.exam',
        'courseByExam.course',
      ],
    });

    if (!session) throw new NotFoundException('Không tìm thấy phiên làm bài');
    // if (session.isSubmitted) {
    //   throw new BadRequestException('Phiên làm bài đã được nộp trước đó');
    // }

    const now = new Date();
    session.isSubmitted = true;
    session.submittedAt = now;

    let totalMultipleChoiceScore = 0;
    let questionCountI = 0
    // let questionCountII = 0
    let questionCountIII = 0
    let scoreI = 0
    let scoreII = 0
    let scoreIII = 0
    let totalOriginPartI = 0
    let totalOriginPartII = 0
    let totalOriginPartIII = 0
    let scoreOriginI = 0
    let scoreOriginII = 0
    let scoreOriginIII = 0
    for (const answer of session.answers) {
      const question = answer.questionclone;
      const correctAnswers = question?.answerclones || [];
      if (!question || correctAnswers.length === 0) continue;
      // correctcounte++
      const score = question.score || 0;

      // ================== PHẦN I: Nhiều đáp án ==================
      if (question.multipleChoice.name === 'Phần I') {
        totalOriginPartI += 1
        scoreOriginI += question.score
        const selectedIds = (answer.selectedOption || []).slice().sort((a, b) => a - b);
        const correctIds = correctAnswers
          .filter(a => a.isCorrect)
          .map(a => a.id)
          .sort((a, b) => a - b);

        const isCorrect =
          selectedIds.length === correctIds.length &&
          selectedIds.every((id, i) => id === correctIds[i]);

        answer.isCorrect = isCorrect;
        answer.pointsAchieved = isCorrect ? score : 0;

        if (isCorrect) {
          questionCountI++
          scoreI += score
          totalMultipleChoiceScore += score;
        }
      }

      // ================== PHẦN II: Đúng / Sai từng đáp án ==================
      else if (question.multipleChoice.name === 'Phần II') {
        // console.log(answer.selectedPairs)
        totalOriginPartII += 1
        scoreOriginII += question.score
        const studentPairs = answer?.selectedPairs || [];
        // console.log(answer.selectedPairs, '1111')
        let correctCount = 0;
        for (const correctAns of correctAnswers) {
          // console.log(correctAns)
          const matched = studentPairs.find(
            a => a.id === correctAns.id && a.isCorrect === correctAns.isCorrect
          );
          if (matched) correctCount++;
        }
        // console.log(correctCount)

        const percentCorrect = correctCount / correctAnswers.length;
        const partialScore = +(score * percentCorrect).toFixed(2);
        // console.log(partialScore)
        answer.isCorrect = percentCorrect === 1;
        answer.pointsAchieved = partialScore;
        scoreII += partialScore
        totalMultipleChoiceScore += partialScore;
      }

      // ================== PHẦN III: So sánh chuỗi ==================
      else if (question.multipleChoice.name === 'Phần III') {
        totalOriginPartIII += 1;
        scoreOriginIII += question.score;

        // chuẩn hóa: trim, lowercase, bỏ hết khoảng trắng
        const expected = (correctAnswers[0]?.content || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '');
        const studentAnswer = (answer.essayAnswer || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '');

        const isCorrect = expected === studentAnswer;

        answer.isCorrect = isCorrect;
        answer.pointsAchieved = isCorrect ? score : 0;

        if (isCorrect) {
          questionCountIII++;
          scoreIII += score;
          totalMultipleChoiceScore += score;
        }
      }
    }
    // Lưu kết quả tổng
    session.totalMultipleChoiceScore = totalMultipleChoiceScore;
    session.totalScore = totalMultipleChoiceScore
    // session.correctCount = correctcounte
    await this.submitAnswerRepo.save(session.answers);
    await this.examsessionRepo.save(session);

    return {
      success: true,
      submittedAt: now,
      totalMultipleChoiceScore: totalMultipleChoiceScore,
      totalCorrectPartI: {
        questionCountI,
        scoreI,
        totalOriginPartI,
        scoreOriginI
      },
      totalCorrectPartII: {
        scoreII,
        totalOriginPartII,
        scoreOriginII
      },
      totalCorrectPartIII: {
        questionCountIII,
        scoreIII,
        totalOriginPartIII,
        scoreOriginIII
      },
      courseId: session.courseByExam.course.id
    };
  }

  async findOneExamSessionDetail(sessionId: number, user: User) {
    const session = await this.examsessionRepo.findOne({
      where: { id: sessionId },
      relations: [
        'createdBy',
        'answers',
        'answers.createdBy',
        // 'exam',
        'answers.questionclone',
        'answers.questionclone.answerclones',
        'courseByExam',
        'courseByExam.exam',
      ],
      order: {
        answers: {
          order: 'ASC',
        },
      },
    });
    // console.log(session, user)
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên làm bài');
    }

    // Kiểm tra quyền truy cập
    const isOwner = session.createdBy?.id === user.id;
    const isTeacher = user.role === 'Giáo viên'
    if (!isOwner && !isTeacher) {
      throw new ForbiddenException('Bạn không có quyền xem phiên làm bài này');
    }

    // Chuẩn hóa dữ liệu trả về
    const result = {
      sessionId: session.id,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      isSubmitted: session.isSubmitted,
      totalScore: session.totalScore,
      totalMultipleChoiceScore: session.totalMultipleChoiceScore,
      essayScore: session.essayScore,
      correctCount: session.correctCount,
      exam: {
        id: session.courseByExam.exam.id,
        title: session.courseByExam.exam.title,
        scoreOriginPartI: session.courseByExam.exam.totalMultipleChoiceScorePartI,
        scoreOriginPartII: session.courseByExam.exam.totalMultipleChoiceScorePartII,
        scoreOriginPartIII: session.courseByExam.exam.totalMultipleChoiceScorePartIII,
        scoreOriginEssay: session.courseByExam.exam.totalEssayScore,
      },
      questions: session.answers.map(answer => ({
        questionId: answer.questionclone.id,
        content: answer.questionclone.content,
        typeQuestionId: answer.questionclone.typeQuestion,
        answerClones: answer.questionclone.answerclones,
        selectedOption: answer.selectedOption,
        selectedPairs: answer.selectedPairs,
        essayAnswer: answer.essayAnswer,
        isCorrect: answer.isCorrect,
        pointsAchieved: answer.pointsAchieved,
        pointsOrigin: answer.questionclone.score,
        order: answer.order,

      })),
    };

    return result;
  }

  async findAllExamSessions(courseByExamId: number, user): Promise<any[]> {
    const sessions = await this.examsessionRepo.find({
      relations: [
        'courseByExam',
        'courseByExam.createdBy', // để check GV tạo
        // 'exam',
        'courseByExam.exam',
        'courseByExam.students',
        'answers',
        'answers.questionclone',
        // 'answers.createdBy',
        'answers.questionclone.answerclones',
        'createdBy',
      ],
      where: {
        courseByExam: {
          id: courseByExamId,
          createdBy: { id: user.id } // chỉ cho xem nếu là GV tạo
        }
      },
      order: { startedAt: 'DESC' },
    });
    return sessions
    // return sessions.map((session) => ({
    //   sessionId: session.id,
    //   examTitle: session.courseByExam.exam.title,
    //   startedAt: session.startedAt,
    //   submittedAt: session.submittedAt,
    //   isSubmitted: session.isSubmitted,
    //   totalScore: session.totalScore,
    //   totalMultipleChoiceScore: session.totalMultipleChoiceScore,
    //   essayScore: session.essayScore,
    //   correctCount: session.correctCount,
    //   student: {
    //     id: session.createdBy.id,
    //     name: session.createdBy.fullName
    //   }
    // }));
  }

  // async updateExamSessionScore(
  //   sessionId: number,
  //   answers: { id: number; pointsAchieved: number }[],
  //   user: User
  // ) {
  //   // Lấy session + courseByExam + createdBy
  //   const session = await this.examsessionRepo.findOne({
  //     where: { id: sessionId },
  //     relations: [
  //       'courseByExam',
  //       'courseByExam.createdBy', // để check giáo viên tạo
  //       'answers',
  //     ],
  //   });

  //   if (!session) {
  //     throw new NotFoundException('Không tìm thấy phiên làm bài');
  //   }

  //   // Kiểm tra quyền: chỉ giáo viên tạo courseByExam mới được chấm
  //   if (!session.courseByExam?.createdBy || session.courseByExam.createdBy.id !== user.id) {
  //     throw new ForbiddenException('Bạn không có quyền chấm bài thi này');
  //   }

  //   if (!session.isSubmitted) {
  //     throw new BadRequestException('Bài thi chưa được nộp, không thể chấm điểm');
  //   }

  //   // Lấy danh sách SubmitAnswer cần update
  //   const submitAnswers = await this.submitAnswerRepo.find({
  //     where: {
  //       session: { id: sessionId },
  //       id: In(answers.map((a) => a.id)),
  //     },
  //   });

  //   if (!submitAnswers.length) {
  //     throw new NotFoundException('Không tìm thấy câu trả lời cần chấm điểm');
  //   }

  //   const pointsMap = new Map(answers.map((a) => [a.id, a.pointsAchieved]));

  //   // Update điểm từng câu
  //   submitAnswers.forEach((ans) => {
  //     ans.pointsAchieved = pointsMap.get(ans.id) ?? 0;
  //   });

  //   await this.submitAnswerRepo.save(submitAnswers);

  //   // Tính lại essayScore & totalScore
  //   session.essayScore = session.answers.reduce(
  //     (total, a) => total + (a.pointsAchieved || 0),
  //     0
  //   );
  //   session.totalScore =
  //     (session.totalMultipleChoiceScore || 0) + (session.essayScore || 0);

  //   await this.examsessionRepo.save(session);

  //   return {
  //     message: 'Cập nhật điểm thành công',
  //     totalScore: session.totalScore,
  //     essayScore: session.essayScore,
  //   };
  // }
  async updateExamSessionScore(
    sessionId: number,
    answers: { id: number; pointsAchieved: number }[],
    user: User
  ) {
    // Lấy session + courseByExam + createdBy
    const session = await this.examsessionRepo.findOne({
      where: { id: sessionId },
      relations: [
        'courseByExam',
        'courseByExam.createdBy', // để check giáo viên tạo
        'answers',
      ],
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên làm bài');
    }

    // Kiểm tra quyền: chỉ giáo viên tạo courseByExam mới được chấm
    if (!session.courseByExam?.createdBy || session.courseByExam.createdBy.id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền chấm bài thi này');
    }

    if (!session.isSubmitted) {
      throw new BadRequestException('Bài thi chưa được nộp, không thể chấm điểm');
    }

    // Lấy danh sách SubmitAnswer cần update
    const submitAnswers = await this.submitAnswerRepo.find({
      where: {
        session: { id: sessionId },
        id: In(answers.map((a) => a.id)),
      },
    });

    if (!submitAnswers.length) {
      throw new NotFoundException('Không tìm thấy câu trả lời cần chấm điểm');
    }

    await Promise.all(
      answers.map((answer) =>
        this.submitAnswerRepo
          .createQueryBuilder()
          .update()
          .set({ pointsAchieved: (answer.pointsAchieved || 0) })
          .where("id = :id", { id: answer.id })
          .execute()
      )
    );

    // Tính lại essayScore & totalScore
    const essayScore = answers.reduce(
      (total, a) => total + (a.pointsAchieved || 0),
      0
    );
    const totalScore =
      (session.totalMultipleChoiceScore || 0) + essayScore;

    await this.examsessionRepo.update(session.id, {
      essayScore,
      totalScore,
    });

    return {
      message: 'Cập nhật điểm thành công',
      totalScore,
      essayScore,
    };
  }

















































  async create(createExamSessionDto: CreateExamSessionDto) {
    return 'This action adds a new examSession';
  }
  findAll() {
    return `This action returns all examSession`;
  }
  findOne(id: number) {
    return `This action returns a #${id} examSession`;
  }
  update(id: number, updateExamSessionDto: UpdateExamSessionDto) {
    return `This action updates a #${id} examSession`;
  }
  remove(id: number) {
    return `This action removes a #${id} examSession`;
  }


}
