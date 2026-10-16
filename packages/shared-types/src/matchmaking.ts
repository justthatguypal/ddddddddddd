import { z } from 'zod';
import { BotTier, GameMode, IsoDate, Region } from './common.js';
import { JoinTicket } from './servers.js';

export const QueueBody = z.object({
  mode: GameMode,
  region: Region,
  fillBots: z.boolean().default(true),
  botDifficulty: BotTier.optional(),
});
export type QueueBody = z.infer<typeof QueueBody>;

export const QueueState = z.enum(['idle', 'queued', 'matched']);
export type QueueState = z.infer<typeof QueueState>;

export const QueueStatus = z.object({
  state: QueueState,
  mode: GameMode.nullable(),
  region: Region.nullable(),
  fillBots: z.boolean().nullable(),
  queuedAt: IsoDate.nullable(),
  position: z.number().int().nullable(),
  playersInQueue: z.number().int(),
  estimatedWaitSec: z.number().int().nullable(),
  match: JoinTicket.nullable(),
});
export type QueueStatus = z.infer<typeof QueueStatus>;

export const MatchFound = JoinTicket.extend({ botCount: z.number().int(), humanCount: z.number().int() });
export type MatchFound = z.infer<typeof MatchFound>;
