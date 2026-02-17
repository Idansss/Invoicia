import { getRedis } from "@/server/redis";

type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export async function rateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / params.windowSeconds);
  const redisKey = `rl:${params.key}:${bucket}`;

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, params.windowSeconds + 1);
    if (count > params.limit) {
      const ttl = await redis.ttl(redisKey);
      return { ok: false, retryAfterSeconds: Math.max(1, ttl) };
    }
    return { ok: true };
  } catch {
    // Dev-friendly fallback: no hard block if Redis isn't available.
    return { ok: true };
  }
}
