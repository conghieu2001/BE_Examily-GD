import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from './auth.decorator';
import {Request} from 'express';
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
      private jwtService: JwtService,
      private reflector: Reflector
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
  
      if (isPublic) {
        // 💡 Chỉ cần có token là đc truy cập
        return true;
      }
      const token = this.extractTokenFromHeader(request);
      // console.log(token)
      if (!token) {
        throw new UnauthorizedException('Ko có token');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret:'thienthanh132',
        });
        // console.log(payload)
        request['user'] = payload;
      } catch (e) {
        // console.log(e)
        if (e instanceof TokenExpiredError) {
          throw new UnauthorizedException('Token hết hạn');
        }
        throw new UnauthorizedException('Token không chính xác');
      }
      return true;
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
}