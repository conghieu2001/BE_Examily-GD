import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Req, Query, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';
import { User } from './entities/user.entity';
import { ChangePassDto } from './dto/change-pass-dto';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('admin')
  @Public()
  async createAdmin() {

    const userDto: CreateUserDto = {
      fullName: `Quản Trị Viên`,
      username: 'admin',
      email: 'admin1@gmail.com',
      role: 'Quản trị viên',
      password: '11111111',
      isAdmin: true,
      images: 'public/user/image/default-avatar.png'
    };
    return await this.usersService.create(userDto);
  }


  @Post()
  @Public()
  @UseInterceptors(FileInterceptor('images', {
    storage: storage('user', true), // folder lưu ảnh user
    ...multerOptions,
  }))
  async create(
    @UploadedFile() images: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ) {
    console.log(images)
    const filePath = images ? `public/user/image/${images.filename}` : 'public/user/image/default-avatar.png';
    return await this.usersService.create({ ...createUserDto, images: filePath });
  }

  @Post('change-password')
  async changePassword(@Body() dto: ChangePassDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    const changePass = await this.usersService.changePassword({ ...dto }, user);
    return changePass;
  }

  @Get() // Route GET /users
  @Public() // Mở route nếu không yêu cầu xác thực
  async findAll(@Query() pageOptionsDto: PageOptionsDto, @Req() request: Request) {
    const currentUser = request['user'] ?? null; // Lấy user đang đăng nhập nếu có
    return this.usersService.findAll(pageOptionsDto, currentUser);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  @UseInterceptors(FileInterceptor('images', {
    storage: storage('user', true),
    ...multerOptions,
  }))
  async update(
    @Param('id') id: string,
    @UploadedFile() images: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto
  ) {
    // Lấy user hiện tại từ DB
    const existingUser = await this.usersService.findOne(+id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Nếu có file thì cập nhật đường dẫn ảnh mới
    if (images) {
      updateUserDto.images = `public/user/image/${images.filename}`;
    } else {
      // Không có file => giữ ảnh cũ
      updateUserDto.images = existingUser.images;
    }

    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
