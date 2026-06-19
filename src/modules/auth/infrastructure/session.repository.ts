import { Injectable } from "@nestjs/common";
import { RedisService } from "../../../shared/redis/redis.service";
import { AuthSession } from "../domain/auth-session";

@Injectable()
export class SessionRepository {
  constructor(private readonly redis: RedisService) {}

  async save(session: AuthSession, ttlSeconds: number): Promise<void> {
    await this.redis.connection.set(
      this.key(session.id),
      JSON.stringify(session),
      "EX",
      ttlSeconds,
    );
  }

  async find(sessionId: string): Promise<AuthSession | null> {
    const value = await this.redis.connection.get(this.key(sessionId));
    return value ? (JSON.parse(value) as AuthSession) : null;
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.connection.del(this.key(sessionId));
  }

  async exists(sessionId: string): Promise<boolean> {
    return (await this.redis.connection.exists(this.key(sessionId))) === 1;
  }

  private key(sessionId: string): string {
    return `auth:session:${sessionId}`;
  }
}
