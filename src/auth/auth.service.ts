import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from "@nestjs/jwt";
import { User } from "src/users/entities/user.entity";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repoUser: Repository<User>,
    private jwtService: JwtService,
  ) { }
  async logIn(data: LoginDto): Promise<any> {
    const user = await this.repoUser?.findOne({
      where: { username: data.username },
    })
    if (!user) {
      throw new NotFoundException(`Tài khoản hoặc mật khẩu không đúng`)
    }
    if(!user.isActive) {
      throw new BadRequestException(`Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên`)
    }
    const isPass = await bcrypt.compare(data.password, user.password)
    if (!isPass) {
      throw new BadRequestException(`Tài khoản hoặc mật khẩu không đúng`)
    }
    const payload = { ...user, password: undefined }
    
    // Access token (thời gian ngắn)
    const accessToken = this.jwtService.sign(payload);
    // Refresh token (thời gian dài hơn)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN_REFRESH,
      secret: process.env.JWT_REFRESH_SECRET,
    });
    // Mã hóa và lưu refreshToken vào DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.repoUser.update(user.id, { refreshToken: hashedRefreshToken });
    // console.log(payload, accessToken)
    return {
       ...payload,
       accessToken: accessToken,
       refreshToken,
    };
  }
  async refreshToken(refreshToken: string, id:number) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });



      const user = await this.repoUser.findOne({ where: { id: id } });
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('No refresh token found');
      }

      // so sánh token client gửi với token hash trong DB
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }


      if (!user) {
        throw new Error('Refresh token không hợp lệ hoặc đã bị revoke');
      }

      const data = { ...user, password: undefined }
      const newAccessToken = this.jwtService.sign(
        data,
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN,
        }
      );

      return {
        ...data,
        accessToken: newAccessToken,
        refreshToken,
      };
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }

}
