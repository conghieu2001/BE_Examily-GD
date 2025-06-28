import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { isEmail } from 'class-validator';
import { UserUtil } from 'src/common/bryct/config.bryct';
import { ChangePassDto } from './dto/change-pass-dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>
  ) { }
  async create(createUserDto: CreateUserDto) {
    const { fullName, username, password, role = 'Học sinh', isAdmin } = createUserDto;
   
   
    const user = await this.userRepo.save({
      fullName,
      username,
      password: UserUtil.hashPassword(password),
      role,
      isAdmin: isAdmin ?? false,
      avatar: '/public/default/default-user.jpg', 
    });
    // console.log(user)
    return user;
  }
  async changePassword(dto: ChangePassDto, user: User): Promise<User> {
    const { password, newPassword } = dto;

    // 1️⃣ Tìm user theo `userId`
    const checkUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    // 2️⃣ Kiểm tra mật khẩu cũ
    const isMatch = await UserUtil.comparePassword(password, checkUser.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }
    // Kiểm tra độ dài password
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự!');
    }
    // 3️⃣ Mã hóa mật khẩu mới
    const hashedPassword = await UserUtil.hashPassword(newPassword);

    // 4️⃣ Lưu mật khẩu mới vào database
    user.password = hashedPassword;
    const newUser = await this.userRepo.save(user);

    return newUser;
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<User>): Promise<PageDto<User>> {
    const queryBuilder = this.userRepo.createQueryBuilder('user')
  
    const { page, take, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'take', 'skip', 'order', 'search'];
  
    // Lọc theo các trường khác
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        if (!pagination.includes(key)) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: query[key] });
        }
      }
    }
  
    // Tìm kiếm theo tên hoặc email (tuỳ chỉnh)
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(user.username)) ILIKE LOWER(unaccent(:search)) OR LOWER(unaccent(user.email)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }
  
    queryBuilder.orderBy('user.createdAt', order)
      .skip(skip)
      .take(take);
  
    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
  
    const items = await queryBuilder.getMany();
  
    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });
  
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
  
    return user;
  }

  

  async remove(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`)
    }
    await this.userRepo.softDelete(id);
    return user
  }
}
