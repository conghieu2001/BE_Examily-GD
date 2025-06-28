import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { Order } from 'src/common/paginations/interfaces/order.interface';
import { Role } from './role.enum';

@Injectable()
export class RolesService {
  create(createRoleDto: CreateRoleDto) {
    return 'This action adds a new role';
  }

  findAll() {
    const roles: any = Object.values(Role);
    const itemCount = roles.length;
    const pageOptions: PageOptionsDto = {
      page: 1,
      take: itemCount,
      skip: 0,
      order: Order.ASC,
      search: '',
    }
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(roles, pageMetaDto);
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
