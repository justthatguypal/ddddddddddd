import { z } from 'zod';
import { IsoDate, Region } from './common.js';

export const HealthResponse = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  checks: z.object({
    database: z.enum(['ok', 'down']),
    redis: z.enum(['ok', 'down']),
    orchestrator: z.enum(['ok', 'down', 'unknown']),
  }),
  gameServers: z.object({ online: z.number().int(), total: z.number().int() }),
  queueDepth: z.number().int(),
  uptimeSec: z.number().int(),
  time: IsoDate,
});
export type HealthResponse = z.infer<typeof HealthResponse>;

export const VersionResponse = z.object({
  service: z.string(),
  version: z.string(),
  buildVersion: z.string(),
  commit: z.string(),
  apiVersion: z.literal('v1'),
});
export type VersionResponse = z.infer<typeof VersionResponse>;

export const RegionEndpoint = z.object({
  region: Region,
  label: z.string(),
  /** Host:port pinged by the launcher's latency tool (TCP connect timing). */
  pingHost: z.string(),
  pingPort: z.number().int(),
});
export type RegionEndpoint = z.infer<typeof RegionEndpoint>;

export const PublicConfig = z.object({
  season: z.object({
    number: z.number().int(),
    name: z.string(),
    startsAt: IsoDate,
    endsAt: IsoDate,
  }),
  buildVersion: z.string(),
  regions: z.array(RegionEndpoint),
  features: z.object({
    gifting: z.boolean(),
    refunds: z.boolean(),
    oauth: z.boolean(),
    botTagInKillfeed: z.boolean(),
    registration: z.boolean(),
  }),
  oauthProviders: z.array(z.object({ id: z.string(), label: z.string(), enabled: z.boolean() })),
  shop: z.object({ resetHourUtc: z.number().int().min(0).max(23), currencyNotice: z.string() }),
});
export type PublicConfig = z.infer<typeof PublicConfig>;
