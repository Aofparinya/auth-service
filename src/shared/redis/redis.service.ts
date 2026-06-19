import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  get connection(): Redis {
    return this.client;
  }
}
