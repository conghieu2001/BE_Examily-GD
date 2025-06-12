import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
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

  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    const { refreshToken } = body; // ✅ Lấy refreshToken từ body
    // console.log(refreshToken)
    if (!refreshToken) {
      throw new UnauthorizedException('Không có refresh token');
    }

    try {
      // console.log('SECRET:', process.env.JWT_REFRESH_SECRET);
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.repoUser.findOne({ // ✅ Truy cập trực tiếp repoUser
        where: { id: payload.id },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Không tìm thấy người dùng hoặc refreshToken');
      }

      const bcrypt = await import('bcrypt'); // ✅ Import động nếu cần
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isMatch) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      const newAccessToken = this.jwtService.sign(
        { id: user.id, email: user.email, role: user.role },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc hết hạn');
    }
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
