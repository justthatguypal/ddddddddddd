/**
 * Typed WebSocket (Socket.IO) event contract. Event names are namespaced `domain:event`.
 * Server → client payload schemas are validated on receipt by the launcher.
 */
import { z } from 'zod';
import { IsoDate } from './common.js';
import { MatchFound, QueueStatus } from './matchmaking.js';
import { GameServerInfo } from './servers.js';
import { Friend, Party, PresenceStatus } from './users.js';

export const NotificationKind = z.enum([
  'friend-online',
  'party-invite',
  'shop-refresh',
  'news',
  'maintenance',
  'update-available',
  'match',
  'system',
]);
export type NotificationKind = z.infer<typeof NotificationKind>;

export const AppNotification = z.object({
  id: z.string(),
  kind: NotificationKind,
  title: z.string(),
  body: z.string(),
  createdAt: IsoDate,
  link: z.string().nullable(),
});
export type AppNotification = z.infer<typeof AppNotification>;

export const ServerToClient = {
  'presence:update': Friend,
  'party:invite': z.object({ partyId: z.string(), from: z.object({ id: z.string(), displayName: z.string() }) }),
  'party:update': Party.nullable(),
  'queue:update': QueueStatus,
  'match:found': MatchFound,
  'match:start': z.object({ matchId: z.string(), serverId: z.string() }),
  'match:end': z.object({
    matchId: z.string(),
    placement: z.number().int(),
    kills: z.number().int(),
    playersTotal: z.number().int(),
  }),
  'shop:refresh': z.object({ rotationId: z.string(), date: z.string() }),
  'inventory:update': z.object({ cosmeticIds: z.array(z.string()), reason: z.string() }),
  'balance:update': z.object({ balance: z.number().int(), delta: z.number().int() }),
  'server:heartbeat': GameServerInfo,
  'server:status': z.object({ serverId: z.string(), status: GameServerInfo.shape.status, removed: z.boolean() }),
  'notification:new': AppNotification,
} as const;
export type ServerToClientEvent = keyof typeof ServerToClient;
export type ServerToClientPayload<E extends ServerToClientEvent> = z.infer<(typeof ServerToClient)[E]>;

export const ClientToServer = {
  'presence:set': z.object({ status: PresenceStatus, activity: z.string().max(64).nullable() }),
  'party:invite': z.object({ userId: z.string() }),
  'party:accept': z.object({ partyId: z.string() }),
  'party:leave': z.object({}),
  'servers:subscribe': z.object({}),
  'servers:unsubscribe': z.object({}),
} as const;
export type ClientToServerEvent = keyof typeof ClientToServer;
export type ClientToServerPayload<E extends ClientToServerEvent> = z.infer<(typeof ClientToServer)[E]>;
