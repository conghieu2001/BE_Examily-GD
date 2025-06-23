import { SetMetadata } from "@nestjs/common"
import { RoleInGroup  } from "./role_in_group.enum"

export const ROLES_KEY = 'roles'
export const Roles = (...roles: RoleInGroup []) => SetMetadata(ROLES_KEY, roles)