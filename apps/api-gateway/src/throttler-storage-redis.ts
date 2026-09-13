import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerStorageRedis implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const now = Date.now();
    const windowStart = now - (now % (ttl * 1000));
    const storageKey = `${key}:${windowStart}`;

    const multi = this.redis.multi();
    multi.incr(storageKey);
    multi.pexpire(storageKey, ttl * 1000);
    const results = await multi.exec();

    const totalHits = (results?.[0]?.[1] as number) || 1;
    const timeToExpire = ttl * 1000 - (now % (ttl * 1000));

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}