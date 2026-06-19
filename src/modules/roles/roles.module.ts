import { Controller, Get, Injectable, Module } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/auth/roles.decorator";
import { PrismaService } from "../../shared/database/prisma.service";

@Injectable()
class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { code: "asc" },
    });
  }
}

@ApiTags("roles")
@ApiBearerAuth()
@Roles("ADMIN")
@Controller("roles")
class RolesController {
  constructor(private readonly roles: RolesService) {}
  @Get()
  findAll() {
    return this.roles.findAll();
  }
}

@Module({ controllers: [RolesController], providers: [RolesService] })
export class RolesModule {}
