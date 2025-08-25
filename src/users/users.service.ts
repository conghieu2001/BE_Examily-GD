import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';
import { isEmail } from 'class-validator';
import { UserUtil } from 'src/common/bryct/config.bryct';
import { ChangePassDto } from './dto/change-pass-dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { ItemDto, PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';
import { Role } from 'src/roles/role.enum';
import { paginationKeyword } from 'src/utils/keywork-pagination';
import { Class } from 'src/classes/entities/class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
  ) { }
  async create(createUserDto: CreateUserDto, createdByUser: User): Promise<User> {
    const {
      fullName,
      username,
      password,
      role = Role.STUDENT,
      isAdmin,
      classIds = [],
      subjectIds = [],
    } = createUserDto;

    // Kiểm tra trùng username
    const existingUser = await this.userRepo.findOne({ where: { username } });
    if (existingUser) {
      throw new BadRequestException('Username đã được sử dụng');
    }

    // Băm mật khẩu
    const hashedPassword = UserUtil.hashPassword(password.toString());

    // Phân quyền: chỉ admin mới có quyền set role khác hoặc gán isAdmin
    const assignedRole = createdByUser.role === Role.ADMIN ? role : Role.STUDENT;
    const assignedIsAdmin = createdByUser.role === Role.ADMIN ? (isAdmin ?? false) : false;

    // Lấy các lớp & môn học nếu có
    const classes = classIds.length
      ? await this.classRepo.findBy({ id: In(classIds) })
      : [];

    const subjects = subjectIds.length
      ? await this.subjectRepo.findBy({ id: In(subjectIds) })
      : [];

    //Tạo user
    const newUser = this.userRepo.create({
      fullName,
      username,
      password: hashedPassword,
      role: assignedRole,
      isAdmin: assignedIsAdmin,
      avatar: '/public/default/default-user.jpg',
      createdBy: createdByUser,
      classes,
      subjects,
    });

    return this.userRepo.save(newUser);
  }

  async changePassword(id: number, dto: ChangePassDto, user: User): Promise<Partial<User>> {
    const { password, newPassword } = dto;

    // 1️⃣ Tìm user theo `userId`
    const checkUser = await this.userRepo.findOne({ where: { id: id }, relations: ['createdBy'] });
    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    // 2️⃣ Kiểm tra mật khẩu cũ
    const isMatch = await UserUtil.comparePassword(password, checkUser.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    // 3️⃣ Mã hóa mật khẩu mới
    const hashedPassword = await UserUtil.hashPassword(newPassword);

    // 4️⃣ Lưu mật khẩu mới vào database
    user.password = hashedPassword;
    const newUser = await this.userRepo.save(user);

    return {
      ...newUser,
      password: undefined,
    };
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<User>, user): Promise<PageDto<User>> {
    const queryBuilder = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.classes', 'classes')
      .leftJoinAndSelect('user.subjects', 'subjects')
      .leftJoin('user.createdBy', 'createdBy')
      .addSelect([
        'createdBy.fullName',
      ])

    const { page, take, skip, order, search } = pageOptions;
    const pagination: string[] = paginationKeyword;
    if (user.role == Role.TEACHER) {
      queryBuilder.andWhere('user.role = :role', { role: Role.STUDENT }); // Chỉ lấy người dùng không phải admin
    }
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
        `LOWER(unaccent(user.fullName)) ILIKE LOWER(unaccent(:search)) OR LOWER(unaccent(user.username)) ILIKE LOWER(unaccent(:search))`,
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

  async findOne(id: number): Promise<ItemDto<User>> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['classes', 'subjects', 'createdBy'],
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    return new ItemDto(user);
  }

  async blockUser(id: number, currentUser: User): Promise<User> {
    const targetUser = await this.userRepo.findOne({ where: { id }, relations: ['createdBy'] });

    if (!targetUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const isTargetAdmin = targetUser.role === Role.ADMIN;
    const isTargetTeacher = targetUser.role === Role.TEACHER;
    const isCurrentAdmin = currentUser.role === Role.ADMIN;

    if (isTargetAdmin) {
      throw new BadRequestException(`Bạn không có quyền chặn người dùng này`);
    }

    if (isTargetTeacher && !isCurrentAdmin) {
      throw new BadRequestException(`Bạn không có quyền chặn người dùng này`);
    }

    targetUser.isActive = false;
    await this.userRepo.save(targetUser);

    return targetUser;
  }

  async unblockUser(id: number, currentUser: User): Promise<User> {
    const targetUser = await this.userRepo.findOne({ where: { id }, relations: ['createdBy'] });

    if (!targetUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const isTargetAdmin = targetUser.role === Role.ADMIN;
    const isTargetTeacher = targetUser.role === Role.TEACHER;
    const isCurrentAdmin = currentUser.role === Role.ADMIN;

    if (isTargetAdmin) {
      throw new BadRequestException(`Bạn không có quyền mở chặn người dùng này`);
    }

    if (isTargetTeacher && !isCurrentAdmin) {
      throw new BadRequestException(`Bạn không có quyền mở chặn người dùng này`);
    }

    targetUser.isActive = true;
    await this.userRepo.save(targetUser);

    return targetUser;
  }

  async resetPassword(id: number, user: User): Promise<User> {
    const targetUser = await this.userRepo.findOne({ where: { id }, relations: ['createdBy'] });

    if (!targetUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const newPassword = '1';
    const hashedPassword = UserUtil.hashPassword(newPassword); // mã hóa với salt = 10

    targetUser.password = hashedPassword;

    await this.userRepo.save(targetUser);

    return targetUser;
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['classes', 'subjects'], });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    user.fullName = data.fullName ?? user.fullName;
    user.username = data.username ?? user.username;
    // Cập nhật lớp nếu có classIds
    if (data.classIds && Array.isArray(data.classIds)) {
      const classEntities = await this.classRepo.findBy({ id: In(data.classIds) });
      user.classes = classEntities;
    }

    // Cập nhật môn nếu có subjectIds
    if (data.subjectIds && Array.isArray(data.subjectIds)) {
      const subjectEntities = await this.subjectRepo.findBy({ id: In(data.subjectIds) });
      user.subjects = subjectEntities;
    }

    await this.userRepo.save(user);

    return user;
  }


  async countTotalAndByRole(): Promise<ItemDto<{
    total: number;
    role: Record<Role, number>;
  }>> {
    // Query: group users by role
    const rows = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.role AS role', 'COUNT(*)::int AS count'])
      .where('user.deletedAt IS NULL') // If you're using soft delete
      .groupBy('user.role')
      .getRawMany<{ role: Role; count: number }>();

    // Calculate total number of users
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    // Initialize result object with all roles (even if some have 0 users)
    const byRole: Record<Role, number> = {} as Record<Role, number>;
    const byRoleConvert: Record<Role, number> = {} as Record<Role, number>;
    const roleLabelMap: Record<string, string> = {
      'Quản trị viên': 'Admin',
      'Giáo viên': 'Teacher',
      'Học sinh': 'Student',
    };

    for (const role of Object.values(Role)) {
      byRoleConvert[roleLabelMap[role]] = 0;
    }

    // Fill in the actual counts
    for (const row of rows) {
      byRole[row.role] = row.count;

      byRoleConvert[roleLabelMap[row.role] || row.role] = row.count; // Map role to enum
    }


    return new ItemDto({ total, role: byRoleConvert });
  }




}
