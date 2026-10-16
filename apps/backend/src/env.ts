import { z } from 'zod';
import { DEFAULT_BUILD_VERSION } from '@ogfn/game-data';

const bool = (def: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .default(def ? 'true' : 'false')
    .transform((v) => v === 'true' || v === '1');

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(3000),
  PUBLIC_HOST: z.string().default('localhost'),
  LOG_LEVEL: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PREFIX: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().min(60).default(900),
  REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  JOIN_TICKET_SECRET: z.string().min(32),
  INTERNAL_API_KEY: z.string().min(16),
  TOTP_ENC_KEY: z.string().min(16),
  CORS_ORIGINS: z.string().default('*'),
  BUILD_VERSION: z.string().default(DEFAULT_BUILD_VERSION),
  GIT_COMMIT: z.string().default('dev'),
  SEASON_START: z.string().datetime().optional(),
  SEASON_END: z.string().datetime().optional(),
  SHOP_RESET_HOUR_UTC: z.coerce.number().int().min(0).max(23).default(0),
  SHOP_SALT: z.string().default('ogfn'),
  STARTING_VBUCKS: z.coerce.number().int().min(0).default(10_000),
  FEATURE_GIFTING: bool(false),
  FEATURE_REFUNDS: bool(false),
  FEATURE_REGISTRATION: bool(true),
  FEATURE_OAUTH: bool(false),
  BOT_TAG_IN_KILLFEED: bool(false),
  RATE_LIMIT_ENABLED: bool(true),
  RATE_LIMIT_MULTIPLIER: z.coerce.number().positive().default(1),
  MM_BOT_FILL_WAIT_MS: z.coerce.number().int().min(0).default(1500),
  MM_MIN_HUMANS: z.coerce.number().int().min(1).default(2),
  MM_TICK_MS: z.coerce.number().int().min(100).default(500),
  SERVER_ALLOCATE_TIMEOUT_MS: z.coerce.number().int().default(10_000),
  GAME_SERVER_HOST: z.string().default('127.0.0.1'),
  GAME_SERVER_BASE_PORT: z.coerce.number().int().default(7777),
  /** Optional JSON array of RegionEndpoint overrides. */
  REGION_ENDPOINTS: z.string().optional(),
  DISPLAY_NAME_COOLDOWN_DAYS: z.coerce.number().int().min(0).default(14),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid backend environment:\n${msg}\nSee .env.example at the repo root.`);
  }
  return parsed.data;
}
