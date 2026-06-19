import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../../../shared/database/prisma.service";
import {
  AssignRolesDto,
  CreateUserDto,
  UpdateUserDto,
} from "../presentation/dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const roles = await this.resolveRoles(dto.roleCodes);
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: await argon2.hash(dto.password),
          firstName: dto.firstName,
          lastName: dto.lastName,
          userRoles: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
        include: this.includeRoles(),
      });
      return this.toResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email already exists");
      }
      throw error;
    }
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: this.includeRoles(),
      orderBy: { createdAt: "desc" },
    });
    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.includeRoles(),
    });
    if (!user) throw new NotFoundException("User not found");
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    const roles = dto.roleCodes
      ? await this.resolveRoles(dto.roleCodes)
      : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email?.trim().toLowerCase(),
        passwordHash: dto.password
          ? await argon2.hash(dto.password)
          : undefined,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: dto.isActive,
        userRoles: roles
          ? {
              deleteMany: {},
              create: roles.map((role) => ({ roleId: role.id })),
            }
          : undefined,
      },
      include: this.includeRoles(),
    });
    return this.toResponse(user);
  }

  async assignRoles(id: string, dto: AssignRolesDto) {
    await this.ensureExists(id);
    const roles = await this.resolveRoles(dto.roleCodes);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        userRoles: {
          deleteMany: {},
          create: roles.map((role) => ({ roleId: role.id })),
        },
      },
      include: this.includeRoles(),
    });
    return this.toResponse(user);
  }

  private async resolveRoles(codes: string[]) {
    const normalized = [...new Set(codes.map((code) => code.toUpperCase()))];
    const roles = await this.prisma.role.findMany({
      where: { code: { in: normalized } },
    });
    if (roles.length !== normalized.length) {
      throw new NotFoundException("One or more roles do not exist");
    }
    return roles;
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.prisma.user.findUnique({ where: { id } }))) {
      throw new NotFoundException("User not found");
    }
  }

  private includeRoles() {
    return {
      userRoles: { include: { role: true } },
    } satisfies Prisma.UserInclude;
  }

  private toResponse(
    user: Prisma.UserGetPayload<{
      include: ReturnType<UsersService["includeRoles"]>;
    }>,
  ) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.userRoles.map(({ role }) => role.code),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
