import { Redis } from "@upstash/redis/cloudflare";

import { env } from "@/lib/env";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}
