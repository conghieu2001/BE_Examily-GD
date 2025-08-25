import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionScoreDto } from './dto/create-question-score.dto';
import { UpdateQuestionScoreDto } from './dto/update-question-score.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionScore } from './entities/question-score.entity';
import { Repository } from 'typeorm';
import { Exam } from 'src/exams/entities/exam.entity';
import { Question } from 'src/questions/entities/question.entity';

@Injectable()
export class QuestionScoreService {
  constructor(
    @InjectRepository(QuestionScore) private questionscoreRepo: Repository<QuestionScore>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
  ) { }
  async create(createQuestionScoreDto: CreateQuestionScoreDto): Promise<QuestionScore> {
    const exam = await this.examRepo.findOne({ where: { id: createQuestionScoreDto.examId } });
    const question = await this.questionRepo.findOne({ where: { id: createQuestionScoreDto.questionId } });

    if (!exam || !question) throw new NotFoundException('Exam hoặc Question không tồn tại');

    const questionScore = this.questionscoreRepo.create({
      exam,
      question,
      score: createQuestionScoreDto.score,
    });

    return this.questionscoreRepo.save(questionScore);
  }

  async findAll() {
    return this.questionscoreRepo.find({ relations: ['exam', 'question'] });
  }
  async findOne(id: number): Promise<QuestionScore> {
    const qs = await this.questionscoreRepo.findOne({ where: { id }, relations: ['exam', 'question'] });
    if (!qs) throw new NotFoundException('Không tìm thấy QuestionScore');
    return qs;
  }

  async update(id: number, dto: UpdateQuestionScoreDto): Promise<QuestionScore> {
    const qs = await this.findOne(id);
    if (dto.score !== undefined) qs.score = dto.score;
    return this.questionscoreRepo.save(qs);
  }

  async remove(id: number): Promise<void> {
    const qs = await this.findOne(id);
    await this.questionscoreRepo.remove(qs);
  }
}
