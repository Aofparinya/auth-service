import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import {
  AuthenticatedUser,
  RequestUser,
} from "../../../common/auth/auth.types";
import { PrismaService } from "../../../shared/database/prisma.service";
import { AuthSession } from "../domain/auth-session";
import { SessionRepository } from "../infrastructure/session.repository";

type UserWithAccess = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } };
        };
      };
    };
  };
}>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionRepository,
    config: ConfigService,
  ) {
    this.accessTtl = config.get<number>("JWT_ACCESS_TTL_SECONDS", 900);
    this.refreshTtl = config.get<number>("JWT_REFRESH_TTL_SECONDS", 604800);
    this.accessSecret = config.getOrThrow<string>("JWT_ACCESS_SECRET");
    this.refreshSecret = config.getOrThrow<string>("JWT_REFRESH_SECRET");
  }

  async login(
    email: string,
    password: string,
    context: LoginContext,
  ): Promise<TokenPair> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.findUserWithAccessByEmail(normalizedEmail);
    const valid =
      user?.isActive === true &&
      (await argon2.verify(user.passwordHash, password).catch(() => false));

    await this.prisma.loginHistory.create({
      data: {
        userId: user?.id,
        email: normalizedEmail,
        success: valid,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        reason: valid ? undefined : "INVALID_CREDENTIALS_OR_INACTIVE",
      },
    });

    if (!valid || !user) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokenPair(user);
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<TokenPair> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const userRole = await this.prisma.role.findUnique({
      where: { code: "USER" },
    });
    if (!userRole) {
      throw new InternalServerErrorException(
        "Default USER role is not configured",
      );
    }

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: await argon2.hash(password),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userRoles: { create: { roleId: userRole.id } },
        },
        include: this.accessInclude(),
      });
      return this.issueTokenPair(createdUser);
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

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.sessions.find(payload.sessionId);
    if (
      !session ||
      session.userId !== payload.sub ||
      !(await argon2
        .verify(session.refreshTokenHash, refreshToken)
        .catch(() => false))
    ) {
      if (session) {
        await this.sessions.delete(session.id);
      }
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.findUserWithAccessById(payload.sub);
    if (!user?.isActive) {
      await this.sessions.delete(payload.sessionId);
      throw new UnauthorizedException("User is inactive");
    }

    await this.sessions.delete(payload.sessionId);
    return this.issueTokenPair(user);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.sessions.delete(payload.sessionId);
    } catch {
      return;
    }
  }

  async validateToken(token: string): Promise<RequestUser> {
    try {
      const payload = await this.jwt.verifyAsync<RequestUser>(token, {
        secret: this.accessSecret,
      });
      if (
        payload.type !== "access" ||
        !(await this.sessions.exists(payload.sessionId))
      ) {
        throw new Error("Invalid session");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.findUserWithAccessById(userId);
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }
    return this.toPublicUser(user);
  }

  private async issueTokenPair(user: UserWithAccess): Promise<TokenPair> {
    const sessionId = randomUUID();
    const access = this.toAccessClaims(user, sessionId, "access");
    const refresh = this.toAccessClaims(user, sessionId, "refresh");
    const accessToken = await this.jwt.signAsync(access, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl,
    });
    const refreshToken = await this.jwt.signAsync(refresh, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });
    const session: AuthSession = {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: await argon2.hash(refreshToken),
      createdAt: new Date().toISOString(),
    };
    await this.sessions.save(session, this.refreshTtl);
    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }

  private async verifyRefreshToken(token: string): Promise<RequestUser> {
    try {
      const payload = await this.jwt.verifyAsync<RequestUser>(token, {
        secret: this.refreshSecret,
      });
      if (payload.type !== "refresh") {
        throw new Error("Wrong token type");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private findUserWithAccessByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.accessInclude(),
    });
  }

  private findUserWithAccessById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.accessInclude(),
    });
  }

  private accessInclude() {
    return {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
    } satisfies Prisma.UserInclude;
  }

  private toAccessClaims(
    user: UserWithAccess,
    sessionId: string,
    type: "access" | "refresh",
  ): AuthenticatedUser {
    const roles = user.userRoles.map(({ role }) => role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap(({ role }) =>
          role.rolePermissions.map(({ permission }) => permission.code),
        ),
      ),
    ];
    return {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      sessionId,
      type,
    };
  }

  private toPublicUser(user: UserWithAccess) {
    const claims = this.toAccessClaims(user, "", "access");
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: claims.roles,
      permissions: claims.permissions,
    };
  }
}
