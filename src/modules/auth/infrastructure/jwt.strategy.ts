import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { RequestUser } from "../../../common/auth/auth.types";
import { SessionRepository } from "./session.repository";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly sessions: SessionRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: RequestUser): Promise<RequestUser> {
    if (
      payload.type !== "access" ||
      !(await this.sessions.exists(payload.sessionId))
    ) {
      throw new UnauthorizedException("Invalid session");
    }
    return payload;
  }
}
