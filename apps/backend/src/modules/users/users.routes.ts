import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ChangePasswordBody,
  DeleteAccountBody,
  Friend,
  OkResponse,
  PatchMeBody,
  PublicProfile,
  UserMe,
} from '@ogfn/shared-types';
import { authOf, requireAuth } from '../../common/guards/auth.js';
import type { AppContext } from '../../context.js';

export const usersRoutes =
  (ctx: AppContext): FastifyPluginAsyncZod =>
  async (app) => {
    app.get('/me', { preHandler: requireAuth, schema: { tags: ['users'], response: { 200: UserMe } } }, async (req) =>
      ctx.users.getMe(authOf(req).sub),
    );

    app.patch(
      '/me',
      { preHandler: requireAuth, schema: { tags: ['users'], body: PatchMeBody, response: { 200: UserMe } } },
      async (req) => ctx.users.patchMe(authOf(req).sub, req.body),
    );

    app.post(
      '/me/password',
      { preHandler: requireAuth, schema: { tags: ['users'], body: ChangePasswordBody, response: { 200: OkResponse } } },
      async (req) => {
        const a = authOf(req);
        await ctx.users.changePassword(a.sub, a.sid, req.body.currentPassword, req.body.newPassword);
        return { ok: true as const };
      },
    );

    app.delete(
      '/me',
      { preHandler: requireAuth, schema: { tags: ['users'], body: DeleteAccountBody, response: { 200: OkResponse } } },
      async (req) => {
        await ctx.users.deleteAccount(authOf(req).sub, req.body.confirmDisplayName, req.body.password);
        return { ok: true as const };
      },
    );

    app.get(
      '/me/friends',
      { preHandler: requireAuth, schema: { tags: ['users'], response: { 200: z.array(Friend) } } },
      async (req) => ctx.users.friends(authOf(req).sub),
    );

    app.post(
      '/me/friends',
      {
        preHandler: requireAuth,
        schema: {
          tags: ['users'],
          body: z.object({ displayName: z.string().min(3).max(16) }),
          response: { 200: z.object({ status: z.enum(['PENDING', 'ACCEPTED']) }) },
        },
      },
      async (req) => ctx.users.addFriend(authOf(req).sub, req.body.displayName),
    );

    app.get(
      '/:id/profile',
      { schema: { tags: ['users'], params: z.object({ id: z.string() }), response: { 200: PublicProfile } } },
      async (req) => ctx.users.getProfile(req.params.id),
    );
  };
