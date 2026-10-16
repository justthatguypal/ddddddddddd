/**
 * Redis token-bucket rate limiter.
 *
 * ADR: One Lua script per check keeps the read-refill-consume cycle atomic across backend
 * instances. Buckets are keyed per scope (ip / account / route group) so a single noisy client
 * can't starve others, and the response carries a precise Retry-After.
 */
import type { Redis } from 'ioredis';
import { RK } from './redis.js';

const SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillPerMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local data = redis.call('HMGET', key, 't', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
if tokens == nil then tokens = capacity; ts = now end
tokens = math.min(capacity, tokens + math.max(0, now - ts) * refillPerMs)
local allowed = 0
local retryMs = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retryMs = math.ceil((cost - tokens) / refillPerMs)
end
redis.call('HSET', key, 't', tostring(tokens), 'ts', tostring(now))
redis.call('PEXPIRE', key, math.ceil(capacity / refillPerMs) + 1000)
return { allowed, tostring(tokens), retryMs }
`;

export interface BucketRule {
  /** Burst size. */
  capacity: number;
  /** Tokens restored per second. */
  refillPerSec: number;
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export class RateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly multiplier = 1,
    private readonly now: () => number = Date.now,
  ) {}

  async consume(scope: string, id: string, rule: BucketRule, cost = 1): Promise<RateResult> {
    const capacity = rule.capacity * this.multiplier;
    const refillPerMs = (rule.refillPerSec * this.multiplier) / 1000;
    const res = (await this.redis.eval(SCRIPT, 1, RK.rateLimit(scope, id), capacity, refillPerMs, this.now(), cost)) as [
      number,
      string,
      number,
    ];
    return {
      allowed: res[0] === 1,
      remaining: Math.floor(Number(res[1])),
      retryAfterSec: Math.max(1, Math.ceil(res[2] / 1000)),
    };
  }
}

export const RATE_RULES = {
  ip: { capacity: 120, refillPerSec: 2 },
  account: { capacity: 60, refillPerSec: 1 },
  authIp: { capacity: 10, refillPerSec: 10 / 60 },
  loginEmail: { capacity: 5, refillPerSec: 5 / 300 },
  purchase: { capacity: 10, refillPerSec: 1 },
} satisfies Record<string, BucketRule>;
