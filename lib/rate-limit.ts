/**
 * Rate limiter with Upstash Redis backend (persistent across serverless deploys).
 * Falls back to in-memory when UPSTASH_REDIS_REST_URL / _TOKEN are not set
 * (suitable for local dev and single-instance deployments).
 *
 * To enable persistent rate limiting on Vercel/serverless, add to your env:
 *   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=your-token
 * Get credentials at https://console.upstash.com
 */

import { Redis } from "@upstash/redis";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterMs: number };

// ── Upstash client (initialised once per process) ────────────────────────────

let _redis: Redis | null | undefined = undefined; // undefined = not yet initialised

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    _redis = null;
    return null;
  }
  try {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.warn("[rate-limit] Redis init failed, falling back to in-memory:", e);
    _redis = null;
  }
  return _redis;
}

// ── In-memory fallback ───────────────────────────────────────────────────────

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function maybePrune() {
  if (store.size < 5_000) return;
  const now = Date.now();
  Array.from(store.entries()).forEach(([k, e]) => {
    if (now > e.resetAt) store.delete(k);
  });
}

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  maybePrune();
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }
  return { ok: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Check and increment the rate limit counter for a given key.
 * @param key      Unique identifier (e.g. `login:<ip>`)
 * @param limit    Maximum number of requests allowed in the window
 * @param windowMs Length of the time window in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return rateLimitMemory(key, limit, windowMs);

  // Fixed-window counter via Redis INCR + EXPIRE
  const windowSec  = Math.ceil(windowMs / 1000);
  const windowSlot = Math.floor(Date.now() / 1000 / windowSec);
  const redisKey   = `rl:${key}:${windowSlot}`;

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSec);

    if (count > limit) {
      const resetAtMs = (windowSlot + 1) * windowSec * 1000;
      return { ok: false, remaining: 0, retryAfterMs: resetAtMs - Date.now() };
    }
    return { ok: true, remaining: limit - count, retryAfterMs: 0 };
  } catch {
    // If Redis is unavailable, fall back to in-memory to avoid blocking requests
    return rateLimitMemory(key, limit, windowMs);
  }
}
