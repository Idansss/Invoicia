import Redis from "ioredis";

import { env } from "@/server/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis() {
  if (globalForRedis.redis) return globalForRedis.redis;

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  // Avoid unhandled error events crashing builds/tests when Redis isn't running.
  client.on("error", () => {});

  globalForRedis.redis = client;
  return client;
}

