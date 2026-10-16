import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Errors } from '../filters/errors.js';
import { RATE_RULES } from '../redis/rate-limit.js';
import type { AppContext } from '../../context.js';

export type RateRuleName = keyof typeof RATE_RULES;
export interface RouteRateLimit {
  rule: RateRuleName;
  key: 'ip' | 'user' | ((req: FastifyRequest) => string | undefined);
}

declare module 'fastify' {
  interface FastifyContextConfig {
    rateLimit?: RouteRateLimit[] | false;
  }
}

/** Global per-IP + per-account buckets, plus optional route-specific buckets via `config.rateLimit`. */
export function registerRateLimit(app: FastifyInstance, ctx: AppContext) {
  if (!ctx.env.RATE_LIMIT_ENABLED) return;
  app.addHook('preHandler', async (req, reply) => {
    const routeCfg = req.routeOptions.config?.rateLimit;
    if (routeCfg === false) return;
    const checks: Array<[string, string, (typeof RATE_RULES)[RateRuleName]]> = [['ip', req.ip, RATE_RULES.ip]];
    if (req.auth) checks.push(['account', req.auth.sub, RATE_RULES.account]);
    for (const r of routeCfg ?? []) {
      const id = r.key === 'ip' ? req.ip : r.key === 'user' ? req.auth?.sub : r.key(req);
      if (id) checks.push([r.rule, id, RATE_RULES[r.rule]]);
    }
    let minRemaining = Infinity;
    for (const [scope, id, rule] of checks) {
      const res = await ctx.limiter.consume(scope, id, rule);
      if (!res.allowed) {
        req.log.warn({ scope, id }, 'rate limited');
        throw Errors.rateLimited(res.retryAfterSec);
      }
      minRemaining = Math.min(minRemaining, res.remaining);
    }
    reply.header('x-ratelimit-remaining', String(minRemaining));
  });
}
