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
    const { fullName, username, password, email, role = 'Học sinh', isAdmin, images } = createUserDto;
    if (!fullName || !username || !password || !email) {
      throw new BadRequestException('Điền đầy đủ thông tin.');
    }
    // Kiểm tra định dạng email
    if (!email || !isEmail(email)) {
      throw new BadRequestException('Email không hợp lệ!');
    }

    // Kiểm tra độ dài password
    if (!password || password.length < 8) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự!');
    }

    const existUser = await this.userRepo.findOne({ where: { email } });
    if (existUser) {
      throw new BadRequestException('Email đã tồn tại!');
    }
    const user = await this.userRepo.save({
      fullName,
      email,
      username,
      password: UserUtil.hashPassword(password),
      role,
      images: images,
      isAdmin: isAdmin ?? false,
      // createBy: user
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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
  
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    // Không cho phép cập nhật mật khẩu tại đây
    if ('password' in updateUserDto) {
      delete updateUserDto.password;
    }
    // Kiểm tra email mới (nếu có) không trùng với người dùng khác
    if (updateUserDto.email) {
      const checking = await this.userRepo.findOne({ where: { email: updateUserDto.email } });
  
      if (checking && checking.id !== id) {
        throw new BadRequestException('Email đã được sử dụng bởi người dùng khác!');
      }
    }
  
    // Nếu không có trường nào trong DTO được cập nhật, bỏ qua update
    if (Object.keys(updateUserDto).length === 0) {
      return user;
    }
    // Thực hiện cập nhật
    await this.userRepo.update(id, updateUserDto);
  
    // Trả về bản ghi mới sau cập nhật
    const updatedUser = await this.userRepo.findOne({ where: { id } });
    return updatedUser!;
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
