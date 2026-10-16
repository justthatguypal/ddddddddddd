import { z } from 'zod';
import { BOT_TIERS, BotTier } from './common.js';
import { Rarity } from './cosmetics.js';

const TierWeights = z.object(
  Object.fromEntries(BOT_TIERS.map((t) => [t, z.number().min(0)])) as Record<
    BotTier,
    z.ZodNumber
  >,
);
export type TierWeights = z.infer<typeof TierWeights>;

/** Per-tier tuning. Every knob in spec §4.3 lives here so it can be overridden from JSON. */
export const TierProfile = z.object({
  /** 1-sigma angular aim error in degrees on a stationary target. */
  aimErrorDeg: z.number().min(0),
  /** Extra error per m/s of target lateral velocity (degrees). */
  movingTargetPenaltyDeg: z.number().min(0),
  reactionMs: z.number().int().min(0),
  /** Max crosshair rotation speed, degrees per second. */
  trackingDegPerSec: z.number().positive(),
  fovDeg: z.number().min(30).max(360),
  viewDistance: z.number().positive(),
  hearingRadius: z.number().positive(),
  memoryHalfLifeSec: z.number().positive(),
  perceptionHz: z.number().positive(),
  buildSkill: z.enum(['none', 'basic', 'ramps-walls', 'full-panic', 'full-retake']),
  /** Seconds between structure placements. */
  buildIntervalSec: z.number().positive(),
  canEdit: z.boolean(),
  lootSpeed: z.number().positive(),
  /** Minimum rarity rank (0=common) for floor loot to be worth picking up once armed. */
  lootSnobbery: z.number().int().min(0).max(4),
  /** 0..1 — how early (1) or late (0) the bot rotates relative to the storm timer. */
  rotateEarliness: z.number().min(0).max(1),
  aggression: z.number().min(0).max(1),
  caution: z.number().min(0).max(1),
  burstDiscipline: z.number().min(0).max(1),
  thirdPartyAppetite: z.number().min(0).max(1),
  /** Probability of fleeing instead of engaging when shot first. */
  fleeChance: z.number().min(0).max(1),
});
export type TierProfile = z.infer<typeof TierProfile>;

export const DifficultyCurvePoint = z.object({
  /** Storm phase index (0 = before the first circle). */
  phase: z.number().int().min(0),
  weights: TierWeights,
});

export const BotConfig = z.object({
  version: z.literal(1),
  enabled: z.boolean(),
  maxBots: z.number().int().min(0).max(99),
  /** Total lobby size the director tops up to, per mode. */
  desiredPlayers: z.object({ solo: z.number().int(), duo: z.number().int(), squad: z.number().int() }),
  allowInDuo: z.boolean(),
  allowInSquad: z.boolean(),
  refillIntervalMs: z.number().int().min(50).max(5000),
  /** Starting population weights, applied when bots are spawned. */
  populationWeights: TierWeights,
  /** Survivors are promoted toward these weights as phases advance. */
  difficultyCurve: z.array(DifficultyCurvePoint).min(1),
  tiers: z.record(BotTier, TierProfile),
  cosmetics: z.object({
    /** Cosmetic ids bots may roll. Empty = whole Season 1–3 legal pool. */
    pool: z.array(z.string()),
    rarityWeights: z.record(Rarity, z.number().min(0)),
  }),
  names: z.object({
    poolSize: z.number().int().min(50).max(5000),
    extra: z.array(z.string()),
    seed: z.number().int(),
  }),
  squad: z.object({ infoShareDelayMs: z.number().int(), infoShareFudgeMeters: z.number() }),
  social: z.object({
    emoteAfterKillChance: z.number().min(0).max(1),
    teabagChance: z.number().min(0).max(1),
    thankBusDriverChance: z.number().min(0).max(1),
    rooftopDanceChance: z.number().min(0).max(1),
  }),
  debug: z.object({
    spectator: z.boolean(),
    exposeBotTagInKillfeed: z.boolean(),
    logDecisions: z.boolean(),
  }),
});
export type BotConfig = z.infer<typeof BotConfig>;
