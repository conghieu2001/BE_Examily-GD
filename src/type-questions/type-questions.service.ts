import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateTypeQuestionDto } from './dto/create-type-question.dto';
import { UpdateTypeQuestionDto } from './dto/update-type-question.dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { TypeQuestion } from './entities/type-question.entity';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { paginationKeyword } from 'src/utils/keywork-pagination';

@Injectable()
export class TypeQuestionsService {
  constructor(
    @InjectRepository(TypeQuestion) private repo: Repository<TypeQuestion>,
  ) { }
  async create(createTypeQuestionDto: CreateTypeQuestionDto): Promise<TypeQuestion> {
    const { name } = createTypeQuestionDto;
    if (await this.repo.findOne({ where: { name } })) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
    const newUser = this.repo.create({ name });
    return await this.repo.save(newUser);
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<TypeQuestion>): Promise<PageDto<TypeQuestion>> {
    try {
      const queryBuilder = this.repo.createQueryBuilder('tq');
      const { page, take, skip, order, search } = pageOptions;
      const paginationKeys: string[] = paginationKeyword;

      // Lọc theo các trường truyền vào query
      if (query && Object.keys(query).length > 0) {
        for (const key of Object.keys(query)) {
          if (!paginationKeys.includes(key) && query[key] !== undefined) {
            queryBuilder.andWhere(`tq.${key} = :${key}`, { [key]: query[key] });
          }
        }
      }

      // Tìm kiếm theo tên
      if (search) {
        queryBuilder.andWhere(`LOWER(unaccent(tq.name)) ILIKE LOWER(unaccent(:search))`, {
          search: `%${search}%`,
        });
      }

      queryBuilder
        .orderBy('tq.id', order ?? 'ASC') // 🔁 Sửa từ tq.order → tq.id
        .skip(skip)
        .take(take);

      const itemCount = await queryBuilder.getCount();
      const items = await queryBuilder.getMany();
      const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

      return new PageDto(items, pageMetaDto);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi khi lấy danh sách type question');
    }
  }


  async findOne(id: number): Promise<ItemDto<TypeQuestion>> {

    const example = await this.repo.findOne({ where: { id } });
    if (!example) {
      throw new HttpException('Not found', 404);
    }
    return new ItemDto(example);
  }

  async update(id: number, updateTypeQuestionDto: UpdateTypeQuestionDto) {
    const { name } = updateTypeQuestionDto;
    const exampleExits = await this.repo.findOne({ where: { name, id: Not(id) } });
    if (exampleExits) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    const example = await this.repo.findOne({ where: { id } });

    if (!example) {
      throw new NotFoundException(`TypeQuestion with ID ${id} not found`);
    }

    Object.assign(example, updateTypeQuestionDto)

    await this.repo.update(id, example)

    return new ItemDto(example);;
  }
  async remove(id: number) {
    const example = this.repo.findOne({ where: { id } });
    if (!example) {
      throw new NotFoundException('Không tìm thấy tài nguyên');
    }
    await this.repo.delete(id);
    return new ItemDto(await this.repo.delete(id));
  }
}
