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
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ImportExcelUser } from './dto/import-excel.dto';
import * as XLSX from 'xlsx';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // @Post('admin')
  // @Public()
  // async createAdmin() {
  //   const userDto: CreateUserDto = {
  //     fullName: `Quản Trị Viên`,
  //     username: 'admin',
  //     role: 'Quản trị viên',
  //     password: '11111111',
  //     isAdmin: true,
  //     avatar: '/public/default/default-user.jpg'
  //   };
  //   return await this.usersService.create(userDto);
  // }


  @Post()
  @Roles(Role.TEACHER) // Chỉ cho phép người dùng có vai trò admin hoặc user truy cập
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() request: Request
  ) {
    const user: User = request['user'] ?? null;
    return await this.usersService.create({ ...createUserDto }, user);
  }
 
  @Roles( Role.TEACHER) // Chỉ cho phép người dùng có vai trò admin hoặc user truy cập
  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data') // <- rất quan trọng để Swagger hiểu
  @ApiBody({
    description: 'Upload Excel file',
    type: ImportExcelUser,
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    console.log(user);
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    // Lấy sheet đầu tiên
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const data:any = XLSX.utils.sheet_to_json(sheet);
    if (!data || data.length === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu trong file Excel');
    }
    const results: User[] = [];
    const errors: { massage: string, row: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const createUserDto: CreateUserDto = {
          fullName: item['Họ và tên'] || item['Full Name'],
          username: item['Tên đăng nhập'] || item['Username'],
          password: item['Mật khẩu'] || item['Password'],
          role: 'Học Sinh',
          isAdmin: false,
          avatar: item['Ảnh đại diện'] || item['Avatar'] || '/public/default/default-user.jpg',
        };
        console.log(createUserDto);
        const newUser = await this.usersService.create({ ...createUserDto }, user);
        console.log(newUser, 'thoieeiialskd;laskjd;ád');
        results.push(newUser) // Cập nhật user mới tạo vào request
      } catch (error) {
        console.log(error);
        errors.push({
          massage: error.message || 'Lỗi không xác định',
          row: results.length + errors.length + 1 // Dòng lỗi trong file Excel
        })
      }
    }
    return {results, errors};
  }

  @Post('change-password')
  async changePassword(@Body() dto: ChangePassDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    const changePass = await this.usersService.changePassword({ ...dto }, user)
    return changePass;
  }

  @Roles(Role.TEACHER) // Chỉ cho phép người dùng có vai trò admin hoặc user truy cập
  @Get() // Route GET /users
  async findAll(@Query() pageOptionsDto: PageOptionsDto, @Query() query: Partial<User>, @Req() request: Request) {
    const user = request['user'] ?? null; // Lấy user đang đăng nhập nếu có
    return this.usersService.findAll(pageOptionsDto, query);
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
