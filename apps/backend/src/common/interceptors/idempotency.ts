/**
 * Generic idempotency layer for mutating routes.
 *
 * ADR: Clients send `Idempotency-Key` on POST/PATCH/DELETE. The first request claims the key
 * with SET NX (status "pending"); concurrent duplicates get 409 IDEMPOTENCY_IN_PROGRESS;
 * completed requests are replayed verbatim for 24h. A key reused with a different body is
 * rejected with 422 — that is always a client bug. 5xx responses release the key so a retry
 * can succeed. Money-moving routes ALSO enforce idempotency in the database (belt + braces).
 */
import type { FastifyInstance } from 'fastify';
import { IDEMPOTENCY_HEADER } from '@ogfn/shared-types';
import { Errors } from '../filters/errors.js';
import { RK } from '../redis/redis.js';
import { sha256 } from '../util/crypto.js';
import type { AppContext } from '../../context.js';

interface Stored {
  status: 'pending' | 'done';
  fingerprint: string;
  statusCode?: number;
  body?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    idempotency: { redisKey: string; fingerprint: string; key: string } | null;
  }
}

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const PENDING_TTL_SEC = 60;
const DONE_TTL_SEC = 86_400;

export function registerIdempotency(app: FastifyInstance, ctx: AppContext) {
  app.decorateRequest('idempotency', null);

  app.addHook('preHandler', async (req, reply) => {
    const key = req.headers[IDEMPOTENCY_HEADER];
    if (!MUTATING.has(req.method) || typeof key !== 'string') return;
    if (!/^[\w-]{8,128}$/.test(key)) throw Errors.badRequest('Idempotency-Key must be 8-128 chars of [A-Za-z0-9_-]');
    const scope = req.auth?.sub ?? `ip:${req.ip}`;
    const redisKey = RK.idempotency(scope, key);
    const fingerprint = sha256(`${req.method} ${req.routeOptions.url ?? req.url} ${JSON.stringify(req.body ?? null)}`);
    const pending: Stored = { status: 'pending', fingerprint };
    const claimed = await ctx.redis.set(redisKey, JSON.stringify(pending), 'EX', PENDING_TTL_SEC, 'NX');
    if (claimed) {
      req.idempotency = { redisKey, fingerprint, key };
      return;
    }
    const raw = await ctx.redis.get(redisKey);
    const existing = raw ? (JSON.parse(raw) as Stored) : null;
    if (!existing) {
      // Expired between SET and GET; treat as fresh.
      await ctx.redis.set(redisKey, JSON.stringify(pending), 'EX', PENDING_TTL_SEC);
      req.idempotency = { redisKey, fingerprint, key };
      return;
    }
    if (existing.fingerprint !== fingerprint) {
      throw Errors.unprocessable('IDEMPOTENCY_MISMATCH', 'Idempotency-Key was already used with a different request');
    }
    if (existing.status === 'pending') {
      throw Errors.conflict('IDEMPOTENCY_IN_PROGRESS', 'A request with this Idempotency-Key is still in progress');
    }
    reply.header('idempotent-replayed', 'true');
    reply.header('content-type', 'application/json; charset=utf-8');
    return reply.status(existing.statusCode ?? 200).send(existing.body ?? '');
  });

  app.addHook('onSend', async (req, reply, payload) => {
    const idem = req.idempotency;
    if (!idem || reply.getHeader('idempotent-replayed')) return payload;
    if (reply.statusCode >= 500 || reply.statusCode === 409 || reply.statusCode === 429) {
      await ctx.redis.del(idem.redisKey);
      return payload;
    }
    const done: Stored = {
      status: 'done',
      fingerprint: idem.fingerprint,
      statusCode: reply.statusCode,
      body: typeof payload === 'string' ? payload : payload == null ? '' : String(payload),
    };
    await ctx.redis.set(idem.redisKey, JSON.stringify(done), 'EX', DONE_TTL_SEC);
    return payload;
  });
}
