import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards, Put, UseInterceptors, UploadedFile, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Question } from './entities/question.entity';
import { Public } from 'src/auth/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ImportExcelQuestion } from './dto/import-excel.dto';
import * as XLSX from 'xlsx';
import { CreateAnswerDto } from 'src/answers/dto/create-answer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Topic } from 'src/topics/entities/topic.entity';
import { Level } from 'src/levels/entities/level.entity';
import { TypeQuestion } from 'src/type-questions/entities/type-question.entity';
import { MultipeChoice } from 'src/multipe-choice/entities/multipe-choice.entity';
import { AnswersService } from 'src/answers/answers.service';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,

    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,

    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,

    @InjectRepository(TypeQuestion)
    private readonly typeQuestionRepo: Repository<TypeQuestion>,

    @InjectRepository(MultipeChoice)
    private readonly multipleChoiceRepo: Repository<MultipeChoice>,  // <-- dòng lỗi đang thiếu

    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,

    private readonly answerService: AnswersService,
  ) { }

  @Post()
  @Public()
  create(@Body() createQuestionDto: CreateQuestionDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.questionsService.create(createQuestionDto, user);
  }

  @Post('import-excel')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload Excel file',
    type: ImportExcelQuestion,
  })
  async importExcel(
    @Body() body: Record<string, any>,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    const user: User = request['user'];
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

    // ✅ Lọc các dòng hợp lệ: có nội dung câu hỏi và là string
    const validData = data.filter(
      (row) =>
        row['Nội dung câu hỏi'] &&
        typeof row['Nội dung câu hỏi'] === 'string' &&
        row['A (Đáp án)'] // ít nhất có 1 đáp án
    );

    if (!validData || validData.length === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu hợp lệ trong file Excel');
    }

    const { classId, subjectId, typeQuestionId } = body;
    const classEntity = await this.classRepo.findOne({ where: { id: Number(classId) } });
    const subject = await this.subjectRepo.findOne({ where: { id: Number(subjectId) } });
    const typeQuestion = await this.typeQuestionRepo.findOne({ where: { id: Number(typeQuestionId) } });

    if (!classEntity || !subject || !typeQuestion) {
      throw new BadRequestException('classId, subjectId, typeQuestionId không hợp lệ');
    }

    const results: any[] = [];
    const errors: { message: string; row: number }[] = [];

    for (let i = 0; i < validData.length; i++) {
      const item = validData[i];
      try {
        const topic = await this.topicRepo.findOne({ where: { name: item['Chủ đề'] } });
        const level = await this.levelRepo.findOne({ where: { name: item['Mức độ'] } });
        const mc = await this.multipleChoiceRepo.findOne({ where: { name: item['Nhóm trắc nghiệm'] } });

        if (!topic || !level || !mc) {
          errors.push({
            message: 'Thiếu một trong các entity: Chủ đề, Mức độ, Nhóm trắc nghiệm',
            row: i + 2,
          });
          continue;
        }

        // ✅ Xác định đáp án đúng
        const correctLabel = (item['Đáp án đúng'] || '').toString().trim().toUpperCase();
        const answers: CreateAnswerDto[] = ['A', 'B', 'C', 'D'].map((label) => {
          const content = item[`${label} (Đáp án)`];
          return content
            ? {
              content: content.toString(),
              isCorrect: correctLabel === label,
            }
            : null;
        }).filter((a): a is CreateAnswerDto => a !== null);

        // ✅ Tạo câu hỏi DTO
        const createQuestionDto: CreateQuestionDto = {
          content: item['Nội dung câu hỏi']?.toString() || '',
          answers,
          typeQuestionId: typeQuestion.id,
          levelId: level.id,
          classId: classEntity.id,
          subjectId: subject.id,
          topicId: topic.id,
          multipleChoiceId: mc.id,
        };

        const created = await this.questionsService.create(createQuestionDto, user);
        results.push(created);
      } catch (error) {
        console.error(error);
        errors.push({
          message: error.message || 'Lỗi không xác định',
          row: i + 2,
        });
      }
    }

    return {
      success: true,
      total: data.length,
      validRows: validData.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }



  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Question>) {
    return this.questionsService.findAll(pageOptionDto, query);
  }

  @Get('getbymultipchoice/:id')
  @Public()
  async getByType(@Param('id') typeCode: number) {
    return this.questionsService.findByType(typeCode);
  }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    console.log('1')
    return this.questionsService.update(+id, updateQuestionDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.questionsService.remove(+id);
  }
}
