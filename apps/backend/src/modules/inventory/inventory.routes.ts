import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { EquipBody, FavoriteBody, InventoryResponse, LoadoutState, OkResponse, PresetBody } from '@ogfn/shared-types';
import { authOf, requireAuth } from '../../common/guards/auth.js';
import type { AppContext } from '../../context.js';

export const inventoryRoutes =
  (ctx: AppContext): FastifyPluginAsyncZod =>
  async (app) => {
    app.addHook('preHandler', requireAuth);

    app.get('/', { schema: { tags: ['inventory'], response: { 200: InventoryResponse } } }, async (req) =>
      ctx.inventory.get(authOf(req).sub),
    );

    app.post('/equip', { schema: { tags: ['inventory'], body: EquipBody, response: { 200: LoadoutState } } }, async (req) =>
      ctx.inventory.equip(authOf(req).sub, req.body),
    );

    app.post('/preset', { schema: { tags: ['inventory'], body: PresetBody, response: { 200: LoadoutState } } }, async (req) =>
      ctx.inventory.updatePreset(authOf(req).sub, req.body),
    );

    app.post('/favorite', { schema: { tags: ['inventory'], body: FavoriteBody, response: { 200: OkResponse } } }, async (req) => {
      await ctx.inventory.favorite(authOf(req).sub, req.body.cosmeticId, req.body.favorite);
      return { ok: true as const };
    });
  };
