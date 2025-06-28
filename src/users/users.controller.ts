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
      role: 'Quản trị viên',
      password: '11111111',
      isAdmin: true,
      avatar: '/public/default/default-user.jpg'
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
    @Body() createUserDto: CreateUserDto,
  ) {

    return await this.usersService.create({ ...createUserDto });
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
  // update(
  //   @Param('id') id: string,
  //   @Body() updateUserDto: UpdateUserDto,
  //   @UploadedFile() images: Express.Multer.File,
  // ) {
  //   if (!images) {
  //     throw new NotFoundException('Không tìm thấy ảnh đại diện');
  //   }
  //   return this.usersService.update(+id, { ...updateUserDto, images });
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
