import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Level } from './entities/level.entity';
import { Repository } from 'typeorm';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level) private levelRepo: Repository<Level>
  ) { }
  async create(createLevelDto: CreateLevelDto) {
    const { name } = createLevelDto
    const checkName = await this.levelRepo.findOne({ where: { name } })
    if (checkName) {
      throw new HttpException('Tên đã tồn tại', 409)
    }
    const newLevel = await this.levelRepo.save({
      name
    })
    return newLevel
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Level>,
  ): Promise<PageDto<Level>> {
    const queryBuilder = this.levelRepo.createQueryBuilder('level');

    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường cụ thể (nếu có)
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`level.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo tên level
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(level.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // Sắp xếp và phân trang
    queryBuilder.orderBy('level.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }
  async findOne(id: number): Promise<Level> {
    const level = await this.levelRepo.findOne({ where: { id } });

    if (!level) {
      throw new NotFoundException(`Không tìm thấy level với ID: ${id}`);
    }

    return level;
  }

  async update(id: number, updateLevelDto: UpdateLevelDto): Promise<Level> {
    const { name } = updateLevelDto;

    const level = await this.levelRepo.findOne({ where: { id } });
    if (!level) {
      throw new NotFoundException(`Không tìm thấy Level với ID: ${id}`);
    }

    // Kiểm tra trùng tên (tuỳ yêu cầu, có thể bỏ đoạn này nếu không cần)
    if (name && name !== level.name) {
      const existing = await this.levelRepo.findOne({ where: { name } });
      if (existing) {
        throw new BadRequestException(`Level với tên "${name}" đã tồn tại.`);
      }
      level.name = name;
    }

    return this.levelRepo.save(level);
  }

  async remove(id: number): Promise<ItemDto<Level>> {
    const level = await this.levelRepo.findOne({
      where: { id },
    });

    if (!level) {
      throw new NotFoundException(`Không tìm thấy level với ID: ${id}`);
    }

    await this.levelRepo.softRemove(level);
    return new ItemDto(level);
  }

}
