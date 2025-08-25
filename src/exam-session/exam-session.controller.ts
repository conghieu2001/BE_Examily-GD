import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';
import { User } from 'src/users/entities/user.entity';

@Controller('exam-session')
@UseGuards(RoleGuard)
export class ExamSessionController {
  constructor(private readonly examSessionService: ExamSessionService) { }
  @Get('detail/:id')
  @Roles(Role.STUDENT, Role.TEACHER)
  async getExamSessionDetail(@Param('id', ParseIntPipe) sessionId: number, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examSessionService.findOneExamSessionDetail(sessionId, user);
  }

  @Post()
  @Roles(Role.TEACHER)
  async findAllExamSessions(
    @Body('courseByExamId', ParseIntPipe) courseByExamId: number,
    @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examSessionService.findAllExamSessions(courseByExamId, user);
  }

  @Post('save-multiple-answers/:id')
  @Roles(Role.STUDENT)
  async saveMultipleAnswers(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() body: {
      answers: {
        questionId: number;
        selectedOption?: number[];
        selectedPairs?: { id: number, content: string; isCorrect: boolean }[];
        essayAnswer?: string;
        order?: number;
      }[];
    },
    @Req() request: Request,
  ) {
    const user: User = request['user'] ?? null;
    return this.examSessionService.saveMultipleAnswers(sessionId, body.answers, user);
  }
  @Post('submit/:id')
  @Roles(Role.STUDENT)
  async submitExam(@Param('id', ParseIntPipe) sessionId: number, @Body() body: {
    answers: {
      questionId: number;
      selectedOption?: number[];
      selectedPairs?: { id: number, content: string; isCorrect: boolean }[];
      essayAnswer?: string;
      order?: number;
    }[];
  }, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.examSessionService.submitExam(sessionId, body.answers, user);
  }
  @Patch('scores/:id')
  @Roles(Role.TEACHER)
  async updateEssayScore(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body('answers') answers: { id: number; pointsAchieved: number }[],
    @Req() request: Request
  ) {
    const user: User = request['user'];
    return this.examSessionService.updateExamSessionScore(sessionId, answers, user);
  }
}
