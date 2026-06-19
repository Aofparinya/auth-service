import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RolesGuard } from "../../common/auth/roles.guard";
import { AuthService } from "./application/auth.service";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { SessionRepository } from "./infrastructure/session.repository";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionRepository,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, SessionRepository],
})
export class AuthModule {}
