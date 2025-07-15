import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AnswerCloneService } from './answer-clone.service';
import { CreateAnswerCloneDto } from './dto/create-answer-clone.dto';
import { UpdateAnswerCloneDto } from './dto/update-answer-clone.dto';
import { User } from 'src/users/entities/user.entity';
import { RoleGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';

@Controller('answer-clone')
@UseGuards(RoleGuard)
export class AnswerCloneController {
  constructor(private readonly answerCloneService: AnswerCloneService) { }

  @Post()
  @Roles(Role.TEACHER)
  create(@Body() createAnswerCloneDto: CreateAnswerCloneDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.answerCloneService.create(createAnswerCloneDto, user);
  }

  @Get()
  findAll() {
    return this.answerCloneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.answerCloneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnswerCloneDto: UpdateAnswerCloneDto) {
    return this.answerCloneService.update(+id, updateAnswerCloneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.answerCloneService.remove(+id);
  }
}
