import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamSession } from './entities/exam-session.entity';
import { Repository } from 'typeorm';
import { CourseByExam } from 'src/course-by-exams/entities/course-by-exam.entity';
import { User } from 'src/users/entities/user.entity';
import { SubmitAnswer } from 'src/submit-answer/entities/submit-answer.entity';
import { Question } from 'src/questions/entities/question.entity';

@Injectable()
export class ExamSessionService {
  constructor(
    @InjectRepository(ExamSession) private examsessionRepo: Repository<ExamSession>,
    @InjectRepository(CourseByExam) private courseByExamRepo: Repository<CourseByExam>,
    @InjectRepository(SubmitAnswer) private submitAnswerRepo: Repository<SubmitAnswer>,
  ) { }
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
  shuffle(arr: any[]) {
    return arr
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }
  toDto(question: Question) {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F']; // để mở rộng
    const options = question.answers.map((ans, idx) => ({
      label: labels[idx] ?? `Option ${idx + 1}`,
      id: ans.id,
      content: ans.content,
    }));

    return {
      id: question.id,
      content: question.content,
      options, // [{ label: 'A', content: 'Hà Nội', id: 1 }, ...]
    };
  }
  async startExam(courseByExamId: number, user: User) {
    const courseByExam = await this.courseByExamRepo.findOne({
      where: { id: courseByExamId },
      relations: ['exam', 'exam.questions'],
    });
    if (!courseByExam) throw new NotFoundException('CourseByExam không tồn tại');

    const shuffled = this.shuffle(courseByExam.exam.questions);
    const session = this.examsessionRepo.create({
      createdBy: user,
      courseByExam,
      startedAt: new Date(),
      isSubmitted: false,
    });
    await this.examsessionRepo.save(session);

    const answers = shuffled.map((q, index) => {
      return this.submitAnswerRepo.create({
        session,
        question: q,
        selectedOption: null,
        isCorrect: false,
        order: index,
      });
    });
    await this.submitAnswerRepo.save(answers);

    return {
      sessionId: session.id,
      total: answers.length,
      currentIndex: 0,
      question: this.toDto(answers[0].question),
    };
  }
  async navigateQuestion({
    sessionId,
    currentQuestionId,
    selectedOption,
    nextIndex,
  }: {
    sessionId: number;
    currentQuestionId: number;
    selectedOption: string | null;
    nextIndex: number;
  }) {
    // 1. Lưu lại đáp án hiện tại
    if (selectedOption !== undefined && selectedOption !== null) {
      const currentAnswer = await this.submitAnswerRepo.findOne({
        where: {
          session: { id: sessionId },
          question: { id: currentQuestionId },
        },
        relations: ['question', 'question.answers'],
      });

      if (!currentAnswer) throw new NotFoundException('Không tìm thấy câu trả lời');
      currentAnswer.selectedOption = selectedOption;

      const correctAnswer = currentAnswer.question.answers.find(a => a.isCorrect);
      currentAnswer.isCorrect = correctAnswer?.content === selectedOption;

      await this.submitAnswerRepo.save(currentAnswer);
    }

    // 2. Trả về câu hỏi tiếp theo
    const nextAnswer = await this.submitAnswerRepo.findOne({
      where: {
        session: { id: sessionId },
        order: nextIndex,
      },
      relations: ['question', 'question.answers'],
    });

    if (!nextAnswer) throw new NotFoundException('Không tìm thấy câu hỏi tiếp theo');

    const total = await this.submitAnswerRepo.count({ where: { session: { id: sessionId } } });

    return {
      index: nextIndex,
      total,
      selectedOption: nextAnswer.selectedOption,
      question: this.toDto(nextAnswer.question),
    };
  }
  async finalSubmitExam(sessionId: number, answers: {
    questionId: number;
    selectedOption?: string;
    essayAnswer?: string;
  }[]) {
    const session = await this.examsessionRepo.findOne({
      where: { id: sessionId },
      relations: ['answers', 'answers.question', 'answers.question.answers', 'courseByExam', 'courseByExam.exam'],
    });

    if (!session) throw new NotFoundException('Không tìm thấy phiên làm bài');
    if (session.isSubmitted) throw new BadRequestException('Bài thi đã được nộp');

    let correctCount = 0;

    for (const a of answers) {
      const answer = session.answers.find(ans => ans.question.id === a.questionId);
      if (!answer) continue;

      // Nếu là trắc nghiệm
      if (a.selectedOption !== undefined) {
        answer.selectedOption = a.selectedOption;

        const correct = answer.question.answers.find(opt => opt.isCorrect);
        answer.isCorrect = correct?.content === a.selectedOption;

        if (answer.isCorrect) correctCount++;
      }

      // Nếu là tự luận
      if (a.essayAnswer !== undefined) {
        answer.essayAnswer = a.essayAnswer;
      }
    }

    const totalMcq = session.courseByExam.exam.totalMultipleChoiceScore;
    const mcqDone = session.answers.filter(a => a.selectedOption !== null).length;
    const scorePerQuestion = mcqDone > 0 ? totalMcq / mcqDone : 0;

    session.correctCount = correctCount;
    session.totalScore = parseFloat((correctCount * scorePerQuestion).toFixed(2));
    session.submittedAt = new Date();
    session.isSubmitted = true;

    await this.submitAnswerRepo.save(session.answers);
    await this.examsessionRepo.save(session);

    return {
      message: 'Nộp bài thành công',
      correctCount,
      total: mcqDone,
      score: session.totalScore,
    };
  }

}
