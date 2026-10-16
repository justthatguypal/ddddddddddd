import { z } from 'zod';
import { GameMode, IsoDate } from './common.js';

export const ModeStats = z.object({
  matches: z.number().int(),
  wins: z.number().int(),
  top10: z.number().int(),
  kills: z.number().int(),
  kd: z.number(),
  winRate: z.number(),
});
export type ModeStats = z.infer<typeof ModeStats>;

export const RecentMatch = z.object({
  matchId: z.string(),
  mode: GameMode,
  placement: z.number().int(),
  kills: z.number().int(),
  endedAt: IsoDate,
});

export const StatsMe = z.object({
  overall: ModeStats,
  byMode: z.record(GameMode, ModeStats),
  recent: z.array(RecentMatch),
  resumable: z
    .object({ matchId: z.string(), serverId: z.string(), mode: GameMode, startedAt: IsoDate })
    .nullable(),
});
export type StatsMe = z.infer<typeof StatsMe>;

export const LeaderboardQuery = z.object({
  metric: z.enum(['wins', 'kills', 'matches']).default('wins'),
  mode: GameMode.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const LeaderboardEntry = z.object({
  rank: z.number().int(),
  userId: z.string(),
  displayName: z.string(),
  value: z.number().int(),
});
export const Leaderboard = z.object({
  metric: z.enum(['wins', 'kills', 'matches']),
  entries: z.array(LeaderboardEntry),
});
export type Leaderboard = z.infer<typeof Leaderboard>;
