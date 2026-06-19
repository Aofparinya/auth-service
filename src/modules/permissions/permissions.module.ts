import { Controller, Get, Injectable, Module } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/auth/roles.decorator";
import { PrismaService } from "../../shared/database/prisma.service";

@Injectable()
class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.permission.findMany({ orderBy: { code: "asc" } });
  }
}

@ApiTags("permissions")
@ApiBearerAuth()
@Roles("ADMIN")
@Controller("permissions")
class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}
  @Get()
  findAll() {
    return this.permissions.findAll();
  }
}

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
