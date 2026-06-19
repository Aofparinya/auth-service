import { Controller, Get, Module } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/auth/public.decorator";

@ApiTags("health")
@Public()
@Controller("health")
class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok" as const,
      service: "auth-service" as const,
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
