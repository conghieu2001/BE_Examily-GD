import { Injectable } from '@nestjs/common';
import { CreateAnswerCloneDto } from './dto/create-answer-clone.dto';
import { UpdateAnswerCloneDto } from './dto/update-answer-clone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswerClone } from './entities/answer-clone.entity';
import { DeepPartial, Repository } from 'typeorm';
import { QuestionClone } from 'src/question-clone/entities/question-clone.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AnswerCloneService {
  constructor(
    @InjectRepository(AnswerClone) private answercloneRepo: Repository<AnswerClone>,
    @InjectRepository(QuestionClone) private questionCloneRepo: Repository<QuestionClone>,
  ) { }
  async create(createAnswerCloneDto: CreateAnswerCloneDto, user: User): Promise<AnswerClone> {
    const { content, questioncloneId, isCorrect } = createAnswerCloneDto
    const questioncln = await this.questionCloneRepo.findOne({
      where: { id: questioncloneId }
    })
    const newAnswerClone = this.answercloneRepo.create({
      content,
      isCorrect,
      questionclone: questioncln,
      createdBy: user
    } as DeepPartial<QuestionClone>);
    return await this.answercloneRepo.save(newAnswerClone)
  }

  findAll() {
    return `This action returns all answerClone`;
  }

  findOne(id: number) {
    return `This action returns a #${id} answerClone`;
  }

  update(id: number, updateAnswerCloneDto: UpdateAnswerCloneDto) {
    return `This action updates a #${id} answerClone`;
  }

  remove(id: number) {
    return `This action removes a #${id} answerClone`;
  }
}
