import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser } from "../../../common/auth/current-user.decorator";
import { Public } from "../../../common/auth/public.decorator";
import type { RequestUser } from "../../../common/auth/auth.types";
import { AuthService } from "../application/auth.service";
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ServiceTokenDto,
  ValidateTokenDto,
} from "./dto/auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto.email, dto.password, {
      ipAddress: request.ip,
      userAgent: request.get("user-agent"),
    });
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
    );
  }

  @Public()
  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Public()
  @Post("validate-token")
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateTokenDto) {
    return this.auth.validateToken(dto.token);
  }

  @Public()
  @Post("service-token")
  @HttpCode(HttpStatus.OK)
  serviceToken(@Body() dto: ServiceTokenDto) {
    return this.auth.issueServiceToken(dto.clientId, dto.clientSecret);
  }

  @Get("me")
  @ApiBearerAuth()
  me(@CurrentUser() user: RequestUser) {
    return this.auth.getCurrentUser(user.sub);
  }
}
