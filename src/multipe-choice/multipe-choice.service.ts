import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMultipeChoiceDto } from './dto/create-multipe-choice.dto';
import { UpdateMultipeChoiceDto } from './dto/update-multipe-choice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MultipeChoice } from './entities/multipe-choice.entity';
import { Repository } from 'typeorm';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { paginationKeyword } from 'src/utils/keywork-pagination';

@Injectable()
export class MultipeChoiceService {
  constructor(
    @InjectRepository(MultipeChoice) private multipeChoiceRepo: Repository<MultipeChoice>
  ) { }
  async create(createMultipeChoiceDto: CreateMultipeChoiceDto) {
    const { name, type } = createMultipeChoiceDto
    const checkName = await this.multipeChoiceRepo.findOne({ where: { name } })
    if (checkName) {
      throw new HttpException('Tên đã tồn tại', 409)
    }
    const newMultipechoice = await this.multipeChoiceRepo.save({
      name,
      type
    })
    return newMultipechoice
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<MultipeChoice>,
  ): Promise<PageDto<MultipeChoice>> {
    const queryBuilder = this.multipeChoiceRepo.createQueryBuilder('multipechoice');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys: string[] = paginationKeyword;

    // Lọc theo các trường cụ thể (nếu có)
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`multipechoice.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo tên câu hỏi
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(multipechoice.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // Sắp xếp và phân trang
    queryBuilder.orderBy('multipechoice.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }


  async findOne(id: number): Promise<MultipeChoice> {
    const multipechoice = await this.multipeChoiceRepo.findOne({ where: { id } });

    if (!multipechoice) {
      throw new NotFoundException(`Không tìm thấy multipechoice với ID: ${id}`);
    }

    return multipechoice;
  }

  async update(id: number, updateMultipeChoiceDto: UpdateMultipeChoiceDto): Promise<MultipeChoice> {
    const { name } = updateMultipeChoiceDto;

    const multipechoice = await this.multipeChoiceRepo.findOne({ where: { id } });
    if (!multipechoice) {
      throw new NotFoundException(`Không tìm thấy multipechoice với ID: ${id}`);
    }

    // Kiểm tra trùng tên (tuỳ yêu cầu, có thể bỏ đoạn này nếu không cần)
    if (name && name !== multipechoice.name) {
      const existing = await this.multipeChoiceRepo.findOne({ where: { name } });
      if (existing) {
        throw new BadRequestException(`Multipechoice với tên "${name}" đã tồn tại.`);
      }
      multipechoice.name = name;
    }

    return this.multipeChoiceRepo.save(multipechoice);
  }

  async remove(id: number): Promise<ItemDto<MultipeChoice>> {
    const multipechoice = await this.multipeChoiceRepo.findOne({
      where: { id },
    });

    if (!multipechoice) {
      throw new NotFoundException(`Không tìm thấy multipechoice với ID: ${id}`);
    }

    await this.multipeChoiceRepo.softRemove(multipechoice);
    return new ItemDto(multipechoice);
  }

}
