import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      where: { email: data.email },
    })
    if (!user) {
      throw new NotFoundException(`Tài khoản hoặc mật khẩu không đúng`)
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
      expiresIn: '7d',
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
}
