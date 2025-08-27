import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login-dto';
import { Public } from './auth.decorator';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthGuard } from './auth.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/role.enum';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    @InjectRepository(User) private repoUser: Repository<User>,
  ) { }

  @Post('login')
  @Public()
  async login(@Body() data: LoginDto) {
    const user = await this.authService.logIn(data)
    return user
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string, id:number}) {
    
    return this.authService.refreshToken(body.refreshToken, body['id']);
    } catch (error) {
      console.log(error);
      throw new NotFoundException('Refresh token không hợp lệ hoặc hết hạn');
    }
  

  @Post('logout')
  async logout(@Req() request: Request) {
    const user: User = request['user'] ?? null;
    const userId = user?.id; // lấy id từ accessToken hoặc session

    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng');
    }

    // Tìm và xóa refreshToken của user
    await this.repoUser.update(
      { id: userId },
      { refreshToken: null }
    );

    return { message: 'Đăng xuất thành công' };
  }
}
