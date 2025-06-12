import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private groupRepo: Repository<Group>
  ) { }
  async create(createGroupDto: CreateGroupDto, user: User): Promise<Group> {
    const { name, description } = createGroupDto;
    if (await this.groupRepo.findOne({ where: { name } })) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
    const newUser = this.groupRepo.create({
      name,
      description,
      createdBy: user?.isAdmin ? user : null,
    });
    return await this.groupRepo.save(newUser);
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<Group>): Promise<PageDto<Group>> {
    const queryBuilder = this.groupRepo.createQueryBuilder('groups');
    const { skip, take, order = 'ASC', search } = pageOptions;
    const paginationKeys: string[] = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo các trường cụ thể trong entity Group
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!paginationKeys.includes(key)) {
          queryBuilder.andWhere(`groups.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }

    // Tìm kiếm theo tên
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(groups.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    // Sắp xếp theo cột hợp lệ
    queryBuilder.orderBy('groups.id', order).skip(skip).take(take);

    const itemCount = await queryBuilder.getCount();
    const items = await queryBuilder.getMany();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number): Promise<ItemDto<Group>> {
    const example = await this.groupRepo.findOne({ where: { id }, relations: ['createdBy'] });
    if (!example) {
      throw new NotFoundException(` Không tìm thấy lớp với ID: ${id}`)
    }
    return new ItemDto(example);
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepo.findOne({ where: { id } });

    if (!group) {
      throw new HttpException('Nhóm không tồn tại', 404);
    }
    // Nếu tên được cập nhật, kiểm tra trùng lặp
    if (updateGroupDto.name && updateGroupDto.name !== group.name) {
      const existingGroup = await this.groupRepo.findOne({ where: { name: updateGroupDto.name } });
      if (existingGroup) {
        throw new HttpException('Tên nhóm đã tồn tại', 409);
      }
    }

    // Cập nhật
    Object.assign(group, updateGroupDto);
    return await this.groupRepo.save(group);
  }

  async remove(id: number): Promise<Group> {
    const isClass = await this.groupRepo.findOne({ where: { id } });
    if (!isClass) {
      throw new NotFoundException(`Không tìm thấy lớp với ID: ${id}`);
    }
    await this.groupRepo.softDelete(id); // Sử dụng soft delete
    return isClass; // Trả về dữ liệu trước khi xóa
  }
}
