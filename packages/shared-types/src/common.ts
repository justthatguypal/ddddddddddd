import { z } from 'zod';

/** ISO-8601 timestamp string as produced by `Date.prototype.toISOString()`. */
export const IsoDate = z.string().datetime({ offset: true });
export type IsoDate = z.infer<typeof IsoDate>;

export const Id = z.string().min(1).max(64);

export const REGIONS = ['NA-East', 'NA-West', 'EU', 'OCE', 'BR', 'ASIA'] as const;
export const Region = z.enum(REGIONS);
export type Region = z.infer<typeof Region>;

export const GAME_MODES = ['solo', 'duo', 'squad'] as const;
export const GameMode = z.enum(GAME_MODES);
export type GameMode = z.infer<typeof GameMode>;

export const TEAM_SIZE: Record<GameMode, number> = { solo: 1, duo: 2, squad: 4 };

export const BOT_TIERS = ['recruit', 'regular', 'veteran', 'elite', 'champion'] as const;
export const BotTier = z.enum(BOT_TIERS);
export type BotTier = z.infer<typeof BotTier>;

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export const pageMeta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
export type PageMeta = z.infer<typeof pageMeta>;

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), meta: pageMeta });

export function buildPageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Stable machine-readable error codes. Launcher maps these to copy + recovery actions. */
export const ERROR_CODES = [
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INVALID_CREDENTIALS',
  'TOTP_REQUIRED',
  'TOTP_INVALID',
  'EMAIL_TAKEN',
  'DISPLAY_NAME_TAKEN',
  'DISPLAY_NAME_COOLDOWN',
  'TOKEN_EXPIRED',
  'TOKEN_REUSED',
  'INSUFFICIENT_FUNDS',
  'ALREADY_OWNED',
  'OFFER_EXPIRED',
  'PRICE_CHANGED',
  'FEATURE_DISABLED',
  'IDEMPOTENCY_IN_PROGRESS',
  'IDEMPOTENCY_MISMATCH',
  'SERVER_FULL',
  'SERVER_UNAVAILABLE',
  'WRONG_PASSWORD',
  'ALREADY_QUEUED',
  'NOT_QUEUED',
  'INTERNAL',
] as const;
export const ErrorCode = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiErrorBody = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
    retryAfterSec: z.number().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;

export const OkResponse = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponse>;

export const IDEMPOTENCY_HEADER = 'idempotency-key';
export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const INTERNAL_KEY_HEADER = 'x-internal-key';
