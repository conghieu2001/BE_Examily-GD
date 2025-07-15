import { Injectable } from '@nestjs/common';
import { CreateSubmitAnswerDto } from './dto/create-submit-answer.dto';
import { UpdateSubmitAnswerDto } from './dto/update-submit-answer.dto';

@Injectable()
export class SubmitAnswerService {
  create(createSubmitAnswerDto: CreateSubmitAnswerDto) {
    return 'This action adds a new submitAnswer';
  }

  findAll() {
    return `This action returns all submitAnswer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} submitAnswer`;
  }

  update(id: number, updateSubmitAnswerDto: UpdateSubmitAnswerDto) {
    return `This action updates a #${id} submitAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} submitAnswer`;
  }
}
