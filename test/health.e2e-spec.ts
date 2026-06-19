import {
  Controller,
  Get,
  INestApplication,
  Module,
  VersioningType,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

@Controller("health")
class TestHealthController {
  @Get()
  health() {
    return { status: "ok", service: "auth-service" };
  }
}

@Module({ controllers: [TestHealthController] })
class TestAppModule {}

describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1",
    });
    await app.init();
  });

  afterAll(() => app.close());

  it("GET /api/v1/health", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect({ status: "ok", service: "auth-service" });
  });
});
