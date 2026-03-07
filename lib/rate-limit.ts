/**
 * Simple in-memory rate limiter (per-instance).
 * Adequate for brute-force protection on serverless deployments.
 * For multi-region/high-scale, replace the store with Upstash Redis.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

/** Lazy cleanup — runs when the store grows large to prevent unbounded memory use. */
function maybePrune() {
  if (store.size < 5_000) return;
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (now > entry.resetAt) store.delete(key);
  });
}

/**
 * Check and increment the rate limit counter for a given key.
 * @param key      Unique identifier (e.g. `login:<ip>`)
 * @param limit    Maximum number of requests allowed in the window
 * @param windowMs Length of the time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfterMs: number } {
  maybePrune();
  const now = Date.now();
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
