import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../../common/auth/roles.decorator";
import { UsersService } from "../application/users.service";
import { AssignRolesDto, CreateUserDto, UpdateUserDto } from "./dto/user.dto";

@ApiTags("users")
@ApiBearerAuth()
@Roles("ADMIN")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch(":id/roles")
  assignRoles(@Param("id") id: string, @Body() dto: AssignRolesDto) {
    return this.users.assignRoles(id, dto);
  }
}
