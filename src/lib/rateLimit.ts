import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/*
 * Budget guard for the public prototype (~$5/month on Sonnet 5 at ~1¢ per call).
 * The Anthropic Console spend limit is the hard backstop; these caps spread the budget
 * across the month and stop any one visitor from draining it.
 *
 * Privacy: Redis holds only a salted hash of the visitor's IP and a counter, and every
 * key expires with its window. No reflection content is ever stored.
 */
const VISITOR_LIMIT = 8; // AI calls per visitor per hour
const DAILY_LIMIT = 20; // AI calls across all visitors per UTC day

export type LimitKind = "visitor" | "daily";

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// Fail open after 2s if Redis is unreachable — the Console spend limit still caps cost.
const common = { timeout: 2000, analytics: false } as const;

const visitorLimiter = redis
  ? new Ratelimit({ redis, prefix: "introspect:visitor", limiter: Ratelimit.slidingWindow(VISITOR_LIMIT, "1 h"), ...common })
  : null;
const dailyLimiter = redis
  ? new Ratelimit({ redis, prefix: "introspect:daily", limiter: Ratelimit.fixedWindow(DAILY_LIMIT, "1 d"), ...common })
  : null;

function visitorKey(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  return createHash("sha256").update(`introspect:${ip}`).digest("hex").slice(0, 32);
}

// Local dev without Redis: simple in-memory stand-in so the flow still behaves the same.
const memory = new Map<string, { count: number; resetAt: number }>();
function memoryLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

const MESSAGES: Record<LimitKind, string> = {
  visitor: "You've reflected a lot in a short time. Take a breather and try again in a little while.",
  daily: "Introspect has reached today's limit for this prototype. Come back tomorrow.",
};

/** Returns a 429 response when a limit is hit, otherwise null. Call only for requests that reach Claude. */
export async function rateLimit(req: Request): Promise<Response | null> {
  const key = visitorKey(req);
  let hit: LimitKind | null = null;

  if (visitorLimiter && dailyLimiter) {
    // Check the visitor first so someone over their own limit doesn't eat into the shared daily pool.
    if (!(await visitorLimiter.limit(key)).success) hit = "visitor";
    else if (!(await dailyLimiter.limit("all")).success) hit = "daily";
  } else {
    if (!memoryLimit(`v:${key}`, VISITOR_LIMIT, 60 * 60 * 1000)) hit = "visitor";
    else if (!memoryLimit("daily", DAILY_LIMIT, 24 * 60 * 60 * 1000)) hit = "daily";
  }

  if (!hit) return null;
  return Response.json({ error: MESSAGES[hit], limit: hit }, { status: 429, headers: { "Cache-Control": "no-store" } });
}
