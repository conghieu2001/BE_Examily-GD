import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/auth/auth.decorator";
import { Role } from "./role.enum";
import { ROLES_KEY } from "./role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu là route public thì cho qua
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request['user'];
    // Không có user hoặc không có role yêu cầu thì chặn
    if (!user || !requiredRoles || requiredRoles.length === 0) {
      return false;
    }

    // Admin luôn được truy cập
    if (user.role === Role.ADMIN || user.isAdmin) {
      return true;
    }

    // Kiểm tra role của user có nằm trong requiredRoles không
    return requiredRoles.includes(user.role);
  }
}
