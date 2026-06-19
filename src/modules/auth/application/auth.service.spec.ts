import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../../shared/database/prisma.service";
import { SessionRepository } from "../infrastructure/session.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const user = {
    id: "user-id",
    email: "admin@example.com",
    passwordHash: "",
    firstName: "Admin",
    lastName: "User",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [
      {
        assignedAt: new Date(),
        userId: "user-id",
        roleId: "role-id",
        role: {
          id: "role-id",
          code: "ADMIN",
          name: "Administrator",
          createdAt: new Date(),
          updatedAt: new Date(),
          rolePermissions: [],
        },
      },
    ],
  };

  const prisma = {
    user: { findUnique: jest.fn() },
    loginHistory: { create: jest.fn() },
  } as unknown as PrismaService;
  const jwt = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token"),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const saveSession = jest.fn();
  const sessions = {
    save: saveSession,
    find: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  } as unknown as SessionRepository;
  const config = {
    get: jest.fn((_key: string, fallback: number) => fallback),
    getOrThrow: jest.fn((key: string) => `${key}-with-32-characters-minimum`),
  } as unknown as ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    user.passwordHash = await argon2.hash("Password123!");
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.loginHistory.create as jest.Mock).mockResolvedValue({});
  });

  it("issues tokens and stores a refresh session after login", async () => {
    const service = new AuthService(prisma, jwt, sessions, config);
    const result = await service.login("admin@example.com", "Password123!", {});

    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 900,
    });
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  it("rejects inactive users", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...user,
      isActive: false,
    });
    const service = new AuthService(prisma, jwt, sessions, config);

    await expect(
      service.login("admin@example.com", "Password123!", {}),
    ).rejects.toThrow("Invalid email or password");
  });
});
