import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AccessClaims } from '@ogfn/shared-types';
import { INTERNAL_KEY_HEADER } from '@ogfn/shared-types';
import { AppError, Errors } from '../filters/errors.js';
import { RK } from '../redis/redis.js';
import { safeEqual } from '../util/crypto.js';
import type { AppContext } from '../../context.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AccessClaims | null;
    authError: AppError | null;
  }
}

/**
 * Global onRequest hook: decodes a Bearer token if present. It never rejects on its own —
 * route-level `requireAuth` decides — so public routes still work with a stale token.
 */
export function registerAuthDecoder(app: FastifyInstance, ctx: AppContext) {
  app.decorateRequest('auth', null);
  app.decorateRequest('authError', null);
  app.addHook('onRequest', async (req) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return;
    try {
      const claims = await ctx.tokens.verifyAccess(header.slice(7));
      if (await ctx.redis.exists(RK.revokedSession(claims.sid))) {
        req.authError = Errors.unauthorized('Session has been revoked');
        return;
      }
      req.auth = claims;
    } catch (err) {
      req.authError = err instanceof AppError ? err : Errors.unauthorized();
    }
  });
}

export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
  if (!req.auth) throw req.authError ?? Errors.unauthorized();
}

export function requireRole(role: 'ADMIN') {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (!req.auth!.roles.includes(role)) throw Errors.forbidden();
  };
}

export function requireInternal(ctx: AppContext) {
  return async (req: FastifyRequest) => {
    const key = req.headers[INTERNAL_KEY_HEADER];
    if (typeof key !== 'string' || !safeEqual(key, ctx.env.INTERNAL_API_KEY)) {
      throw Errors.forbidden('Invalid internal key');
    }
  };
}

/** Narrowing helper for handlers behind `requireAuth`. */
export function authOf(req: FastifyRequest): AccessClaims {
  if (!req.auth) throw Errors.unauthorized();
  return req.auth;
}
