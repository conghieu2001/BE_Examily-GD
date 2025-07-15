import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class) private classRepo: Repository<Class>
  ) { }
  async create() {
    for (let i = 1; i <= 12; i++) {
      const className = `Lớp ${i}`

      const existing = await this.classRepo.findOne({ where: { name: className } });
      if (!existing) {
        const newClass = this.classRepo.create({ name: className });
        await this.classRepo.save(newClass);
      }
    }
    return { message: 'success' };
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Class>,
  ): Promise<PageDto<Class>> {
    const queryBuilder = this.classRepo.createQueryBuilder('class');
    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys: string[] = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường cụ thể trong ClassEntity
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`class.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo tên lớp
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(class.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('class.id', order).skip(skip);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }


  async findOne(id: number): Promise<ItemDto<Class>> {
    const checkClass = await this.classRepo.findOne({where: {id}})
    if(!checkClass) {
      throw new NotFoundException(` Không tìm thấy lớp với ID: ${id}`)
    }
    return new ItemDto(checkClass);
  }

  update(id: number, updateClassDto: UpdateClassDto) {
    return `This action updates a #${id} class`;
  }

  remove(id: number) {
    return `This action removes a #${id} class`;
  }
}
