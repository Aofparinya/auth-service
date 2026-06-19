import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  it("allows a user with a required role", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ["ADMIN"] } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects a user without a required role", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ["USER"] } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
