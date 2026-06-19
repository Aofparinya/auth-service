import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3001);
  const corsOrigin = config.get<string>("CORS_ORIGIN", "*");

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(","),
    credentials: corsOrigin !== "*",
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Order Platform Auth Service")
    .setDescription("Authentication, sessions, users, roles and permissions")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "docs",
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(port, "0.0.0.0");
  console.log(`Auth Service is running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

void bootstrap();
