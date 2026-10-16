import { z } from 'zod';
import { BotTier, GameMode, IsoDate, Region } from './common.js';

export const SERVER_STATUSES = ['ONLINE', 'FULL', 'STARTING', 'OFFLINE'] as const;
export const ServerStatus = z.enum(SERVER_STATUSES);
export type ServerStatus = z.infer<typeof ServerStatus>;

export const MatchPhase = z.enum(['lobby', 'bus', 'playing', 'ended']);
export type MatchPhase = z.infer<typeof MatchPhase>;

export const GameServerInfo = z.object({
  id: z.string(),
  name: z.string(),
  region: Region,
  buildVersion: z.string(),
  map: z.string(),
  mode: GameMode,
  status: ServerStatus,
  phase: MatchPhase.nullable(),
  playerCount: z.number().int(),
  botCount: z.number().int(),
  maxPlayers: z.number().int(),
  tickRate: z.number().int(),
  uptimeSec: z.number().int(),
  host: z.string(),
  port: z.number().int(),
  private: z.boolean(),
  passwordProtected: z.boolean(),
  persistent: z.boolean(),
  ownerId: z.string().nullable(),
  matchId: z.string().nullable(),
  lastHeartbeatAt: IsoDate.nullable(),
});
export type GameServerInfo = z.infer<typeof GameServerInfo>;

export const HostServerBody = z.object({
  name: z.string().trim().min(3).max(32),
  region: Region,
  mode: GameMode.default('solo'),
  maxPlayers: z.number().int().min(2).max(100).default(100),
  botCount: z.number().int().min(0).max(99).default(60),
  botDifficulty: BotTier.default('regular'),
  private: z.boolean().default(false),
  password: z.string().min(4).max(32).optional(),
});
export type HostServerBody = z.infer<typeof HostServerBody>;

export const JoinServerBody = z.object({ password: z.string().max(32).optional() });

export const JoinTicket = z.object({
  serverId: z.string(),
  matchId: z.string().nullable(),
  host: z.string(),
  port: z.number().int(),
  mode: GameMode,
  region: Region,
  /** Short-lived signed ticket the game server validates on connect. */
  ticket: z.string(),
  expiresAt: IsoDate,
});
export type JoinTicket = z.infer<typeof JoinTicket>;

export const ServerListQuery = z.object({
  region: Region.optional(),
  mode: GameMode.optional(),
  includeOffline: z.coerce.boolean().default(true),
});
