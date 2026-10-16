import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  AuthResponse,
  LoginBody,
  LogoutBody,
  OkResponse,
  RefreshBody,
  RegisterBody,
  SessionInfo,
  TokenPair,
  TotpDisableBody,
  TotpSetupResponse,
  TotpVerifyBody,
} from '@ogfn/shared-types';
import { authOf, requireAuth } from '../../common/guards/auth.js';
import type { AppContext } from '../../context.js';

export const authRoutes =
  (ctx: AppContext): FastifyPluginAsyncZod =>
  async (app) => {
    const meta = (ip: string, ua?: string) => ({ ip, deviceName: ua?.slice(0, 64) });

    app.post(
      '/register',
      {
        schema: { tags: ['auth'], body: RegisterBody, response: { 201: AuthResponse } },
        config: { rateLimit: [{ rule: 'authIp', key: 'ip' }] },
      },
      async (req, reply) => reply.status(201).send(await ctx.auth.register(req.body, meta(req.ip, req.headers['user-agent']))),
    );

    app.post(
      '/login',
      {
        schema: { tags: ['auth'], body: LoginBody, response: { 200: AuthResponse } },
        config: {
          rateLimit: [
            { rule: 'authIp', key: 'ip' },
            { rule: 'loginEmail', key: (r) => String((r.body as { email?: string })?.email ?? '').toLowerCase() || undefined },
          ],
        },
      },
      async (req) => ctx.auth.login(req.body, meta(req.ip, req.headers['user-agent'])),
    );

    app.post(
      '/refresh',
      { schema: { tags: ['auth'], body: RefreshBody, response: { 200: TokenPair } } },
      async (req) => ctx.auth.refresh(req.body.refreshToken),
    );

    app.post(
      '/logout',
      { preHandler: requireAuth, schema: { tags: ['auth'], body: LogoutBody, response: { 200: OkResponse } } },
      async (req) => {
        await ctx.auth.revokeSession(authOf(req).sid);
        return { ok: true as const };
      },
    );

    app.get(
      '/sessions',
      { preHandler: requireAuth, schema: { tags: ['auth'], response: { 200: z.array(SessionInfo) } } },
      async (req) => ctx.auth.listSessions(authOf(req).sub, authOf(req).sid),
    );

    app.delete(
      '/sessions/:id',
      { preHandler: requireAuth, schema: { tags: ['auth'], params: z.object({ id: z.string() }), response: { 200: OkResponse } } },
      async (req) => {
        await ctx.auth.revokeSession(req.params.id, authOf(req).sub);
        return { ok: true as const };
      },
    );

    app.post(
      '/2fa/setup',
      { preHandler: requireAuth, schema: { tags: ['auth'], response: { 200: TotpSetupResponse } } },
      async (req) => ctx.auth.setupTotp(authOf(req).sub),
    );

    app.post(
      '/2fa/verify',
      { preHandler: requireAuth, schema: { tags: ['auth'], body: TotpVerifyBody, response: { 200: OkResponse } } },
      async (req) => {
        await ctx.auth.verifyTotp(authOf(req).sub, req.body.code);
        return { ok: true as const };
      },
    );

    app.post(
      '/2fa/disable',
      { preHandler: requireAuth, schema: { tags: ['auth'], body: TotpDisableBody, response: { 200: OkResponse } } },
      async (req) => {
        await ctx.auth.disableTotp(authOf(req).sub, req.body.code, req.body.password);
        return { ok: true as const };
      },
    );

    app.post(
      '/exchange',
      {
        preHandler: requireAuth,
        schema: { tags: ['auth'], response: { 200: z.object({ code: z.string(), expiresInSec: z.number().int() }) } },
      },
      async (req) => ctx.auth.createExchangeCode(authOf(req).sub),
    );
  };
