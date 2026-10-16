/**
 * Launcher settings: versioned schema + forward migrations.
 *
 * ADR: Settings live in a single JSON file in Electron's userData dir. Every load runs
 * `migrateSettings`, which walks the file forward one version at a time and finally
 * validates against the current schema. Invalid or unknown fields fall back to defaults
 * per-section (a corrupt Notifications block never wipes your Game settings).
 */
import { z } from 'zod';
import { BotTier, GameMode, Region } from './common.js';
import { ThemeDefinition } from './theme.js';

export const SETTINGS_VERSION = 3;

export const AppearanceSettings = z.object({
  themeId: z.string().default('season-3'),
  /** Present when themeId === 'custom'. */
  customTheme: ThemeDefinition.nullable().default(null),
  accentOverride: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .default(null),
  radius: z.number().min(0).max(12).default(3),
  reduceMotion: z.boolean().default(false),
  background: z
    .object({
      kind: z.enum(['default', 'solid', 'image']),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      imagePath: z.string().nullable(),
    })
    .default({ kind: 'default', color: '#121419', imagePath: null }),
  zoom: z.number().min(0.8).max(1.25).default(1),
  railCollapsed: z.boolean().default(false),
});

export const DEFAULT_LAUNCH_ARGS =
  '-epicapp=Fortnite -epicenv=Prod -epiclocale=en-us -AUTH_TYPE=exchangecode -AUTH_LOGIN={displayName} -AUTH_PASSWORD={exchangeCode}';

export const GameSettings = z.object({
  clientPath: z.string().nullable().default(null),
  defaultMode: GameMode.default('solo'),
  defaultRegion: Region.default('NA-East'),
  fillWithBots: z.boolean().default(true),
  botDifficulty: BotTier.default('regular'),
  launchArgs: z.string().max(2000).default(DEFAULT_LAUNCH_ARGS),
  closeOnLaunch: z.boolean().default(false),
  minimizeOnLaunch: z.boolean().default(true),
  graphicsPreset: z.enum(['low', 'medium', 'high', 'epic', 'auto']).default('auto'),
  /** Skip spawning the real client; the launcher simulates IN GAME (useful without a build). */
  dryRun: z.boolean().default(false),
});

export const AccountSettings = z.object({
  rememberMe: z.boolean().default(true),
  lastEmail: z.string().nullable().default(null),
});

export const NetworkSettings = z.object({
  backendUrl: z.string().url().default('http://localhost:3000'),
  preferredRegion: Region.nullable().default(null),
  proxy: z
    .object({ enabled: z.boolean(), url: z.string() })
    .default({ enabled: false, url: '' }),
  bandwidthLimitKbps: z.number().int().min(0).default(0),
  cacheDir: z.string().nullable().default(null),
});

export const NotificationSettings = z.object({
  friendOnline: z.boolean().default(true),
  partyInvite: z.boolean().default(true),
  shopRefresh: z.boolean().default(true),
  news: z.boolean().default(true),
  maintenance: z.boolean().default(true),
  updateAvailable: z.boolean().default(true),
  doNotDisturb: z
    .object({
      enabled: z.boolean(),
      from: z.string().regex(/^\d{2}:\d{2}$/),
      to: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .default({ enabled: false, from: '23:00', to: '08:00' }),
});

export const AdvancedSettings = z.object({
  logLevel: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  developerMode: z.boolean().default(false),
  offlineMode: z.boolean().default(false),
});

export const LauncherSettings = z.object({
  version: z.literal(SETTINGS_VERSION),
  appearance: AppearanceSettings.default({}),
  game: GameSettings.default({}),
  account: AccountSettings.default({}),
  network: NetworkSettings.default({}),
  notifications: NotificationSettings.default({}),
  advanced: AdvancedSettings.default({}),
  onboardingCompleted: z.boolean().default(false),
});
export type LauncherSettings = z.infer<typeof LauncherSettings>;

export const SETTINGS_SECTIONS = [
  'appearance',
  'game',
  'account',
  'network',
  'notifications',
  'advanced',
] as const;
export const SettingsSection = z.enum(SETTINGS_SECTIONS);
export type SettingsSection = z.infer<typeof SettingsSection>;

const SECTION_SCHEMAS = {
  appearance: AppearanceSettings,
  game: GameSettings,
  account: AccountSettings,
  network: NetworkSettings,
  notifications: NotificationSettings,
  advanced: AdvancedSettings,
} as const;

/** A deep-partial patch: each section may be partially specified. */
export const LauncherSettingsPatch = z
  .object({
    appearance: AppearanceSettings.partial(),
    game: GameSettings.partial(),
    account: AccountSettings.partial(),
    network: NetworkSettings.partial(),
    notifications: NotificationSettings.partial(),
    advanced: AdvancedSettings.partial(),
    onboardingCompleted: z.boolean(),
  })
  .partial();
export type LauncherSettingsPatch = z.infer<typeof LauncherSettingsPatch>;

export function defaultSettings(): LauncherSettings {
  return LauncherSettings.parse({ version: SETTINGS_VERSION });
}

export function defaultSection<S extends SettingsSection>(section: S): LauncherSettings[S] {
  return SECTION_SCHEMAS[section].parse({}) as LauncherSettings[S];
}

export function applySettingsPatch(
  current: LauncherSettings,
  patch: LauncherSettingsPatch,
): LauncherSettings {
  const next: Record<string, unknown> = { ...current };
  for (const section of SETTINGS_SECTIONS) {
    const p = patch[section];
    if (p) next[section] = { ...current[section], ...p };
  }
  if (patch.onboardingCompleted !== undefined) next.onboardingCompleted = patch.onboardingCompleted;
  return LauncherSettings.parse(next);
}

type Migration = (input: Record<string, unknown>) => Record<string, unknown>;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * v1 (launcher 0.0.x): flat `{ version: 1, theme, clientPath, region, backendUrl, reduceMotion }`.
 * v2 (launcher 0.1.0-alpha): grouped sections, `notifications.dnd` was a boolean.
 * v3 (current): DND schedule object, `appearance.zoom`, `game.dryRun`.
 */
const MIGRATIONS: Record<number, Migration> = {
  1: (v1) => ({
    version: 2,
    appearance: { themeId: v1.theme ?? 'season-3', reduceMotion: v1.reduceMotion ?? false },
    game: { clientPath: v1.clientPath ?? null, defaultRegion: v1.region ?? 'NA-East' },
    network: { backendUrl: v1.backendUrl ?? 'http://localhost:3000' },
    notifications: {},
    advanced: {},
  }),
  2: (v2) => {
    const notifications = isObj(v2.notifications) ? { ...v2.notifications } : {};
    const dnd = notifications.dnd;
    delete notifications.dnd;
    notifications.doNotDisturb = { enabled: dnd === true, from: '23:00', to: '08:00' };
    return { ...v2, version: 3, notifications };
  },
};

export interface MigrationReport {
  settings: LauncherSettings;
  fromVersion: number;
  migrated: boolean;
  /** Sections that failed validation and were reset to defaults. */
  resetSections: string[];
}

export function migrateSettings(raw: unknown): MigrationReport {
  if (!isObj(raw)) {
    return { settings: defaultSettings(), fromVersion: 0, migrated: true, resetSections: ['*'] };
  }
  const fromVersion = typeof raw.version === 'number' ? raw.version : 1;
  let cur: Record<string, unknown> = { ...raw, version: fromVersion };
  if (fromVersion > SETTINGS_VERSION) {
    // Written by a newer launcher: keep what we understand, drop the rest.
    cur = { ...cur, version: SETTINGS_VERSION };
  }
  for (let v = fromVersion; v < SETTINGS_VERSION; v++) {
    const m = MIGRATIONS[v];
    if (!m) break;
    cur = m(cur);
  }

  const resetSections: string[] = [];
  const out: Record<string, unknown> = { version: SETTINGS_VERSION };
  for (const section of SETTINGS_SECTIONS) {
    const parsed = SECTION_SCHEMAS[section].safeParse(isObj(cur[section]) ? cur[section] : {});
    if (parsed.success) out[section] = parsed.data;
    else {
      resetSections.push(section);
      out[section] = SECTION_SCHEMAS[section].parse({});
    }
  }
  out.onboardingCompleted = cur.onboardingCompleted === true;
  return {
    settings: LauncherSettings.parse(out),
    fromVersion,
    migrated: fromVersion !== SETTINGS_VERSION,
    resetSections,
  };
}
