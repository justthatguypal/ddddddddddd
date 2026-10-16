/**
 * Internal contracts between the backend and the game-server orchestrator.
 * Commands flow backend → orchestrator over Redis pub/sub; heartbeats and match results
 * flow orchestrator → backend over the internal HTTP API (X-Internal-Key).
 */
import { z } from 'zod';
import { BotTier, GameMode, Region } from './common.js';
import { MatchPhase, ServerStatus } from './servers.js';

export const ORCHESTRATOR_CHANNEL = 'ogfn:orchestrator:commands';
export const ORCHESTRATOR_ALIVE_KEY = 'ogfn:orchestrator:alive';
export const BOT_CONFIG_KEY = 'ogfn:bot-config';

export const ServerSpec = z.object({
  serverId: z.string(),
  name: z.string(),
  region: Region,
  mode: GameMode,
  maxPlayers: z.number().int(),
  botCount: z.number().int(),
  botDifficulty: BotTier,
  buildVersion: z.string(),
  map: z.string(),
  tickRate: z.number().int(),
  host: z.string(),
  port: z.number().int(),
  persistent: z.boolean(),
});
export type ServerSpec = z.infer<typeof ServerSpec>;

export const OrchestratorCommand = z.discriminatedUnion('type', [
  z.object({ type: z.literal('spawn'), spec: ServerSpec }),
  z.object({ type: z.literal('stop'), serverId: z.string(), reason: z.string() }),
  z.object({
    type: z.literal('assign-players'),
    serverId: z.string(),
    matchId: z.string(),
    players: z.array(z.object({ userId: z.string(), displayName: z.string(), team: z.number().int() })),
    fillBots: z.boolean(),
  }),
  z.object({ type: z.literal('reload-bot-config') }),
]);
export type OrchestratorCommand = z.infer<typeof OrchestratorCommand>;

export const ServerHeartbeat = z.object({
  serverId: z.string(),
  status: ServerStatus,
  phase: MatchPhase.nullable(),
  matchId: z.string().nullable(),
  playerCount: z.number().int(),
  botCount: z.number().int(),
  maxPlayers: z.number().int(),
  tickRate: z.number().int(),
  measuredTickRate: z.number(),
  uptimeSec: z.number().int(),
  buildVersion: z.string(),
  host: z.string(),
  port: z.number().int(),
});
export type ServerHeartbeat = z.infer<typeof ServerHeartbeat>;

export const MatchResult = z.object({
  matchId: z.string(),
  serverId: z.string(),
  mode: GameMode,
  region: Region,
  startedAt: z.string(),
  endedAt: z.string(),
  botCount: z.number().int(),
  humanCount: z.number().int(),
  winnerTeam: z.number().int().nullable(),
  players: z.array(
    z.object({
      userId: z.string(),
      placement: z.number().int(),
      kills: z.number().int(),
      damage: z.number().int(),
      survivedSec: z.number().int(),
    }),
  ),
});
export type MatchResult = z.infer<typeof MatchResult>;
