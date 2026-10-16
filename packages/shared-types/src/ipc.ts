/**
 * Electron IPC contract. The preload script only forwards channels listed here; the main
 * process validates every request with `req` and the renderer validates every response
 * with `res`. A malformed payload throws `IpcValidationError` (loudly, in dev).
 */
import { z } from 'zod';
import { GameMode, Region } from './common.js';
import { TokenPair } from './auth.js';
import { LauncherSettings, LauncherSettingsPatch, SettingsSection } from './settings.js';
import { ThemeDefinition } from './theme.js';

export const GameProcessState = z.enum(['idle', 'launching', 'running', 'exited', 'error']);
export type GameProcessState = z.infer<typeof GameProcessState>;

export const GameStatus = z.object({
  state: GameProcessState,
  pid: z.number().int().nullable(),
  startedAt: z.string().nullable(),
  exitCode: z.number().int().nullable(),
  error: z.string().nullable(),
  dryRun: z.boolean(),
});
export type GameStatus = z.infer<typeof GameStatus>;

export const LaunchRequest = z.object({
  mode: GameMode,
  region: Region,
  displayName: z.string(),
  exchangeCode: z.string(),
  backendUrl: z.string(),
  match: z
    .object({ host: z.string(), port: z.number().int(), ticket: z.string(), serverId: z.string() })
    .nullable(),
  offline: z.boolean(),
});
export type LaunchRequest = z.infer<typeof LaunchRequest>;

export const ExeValidation = z.object({
  ok: z.boolean(),
  path: z.string(),
  reason: z.string().nullable(),
  detectedBuild: z.string().nullable(),
});
export type ExeValidation = z.infer<typeof ExeValidation>;

export const RegionPing = z.object({
  region: Region,
  host: z.string(),
  ms: z.number().nullable(),
  error: z.string().nullable(),
});
export type RegionPing = z.infer<typeof RegionPing>;

export const SystemInfo = z.object({
  appVersion: z.string(),
  electron: z.string(),
  chrome: z.string(),
  node: z.string(),
  platform: z.string(),
  arch: z.string(),
  logDir: z.string(),
  userDataDir: z.string(),
  communityThemesDir: z.string(),
  isPackaged: z.boolean(),
});
export type SystemInfo = z.infer<typeof SystemInfo>;

export const UpdaterStatus = z.object({
  state: z.enum(['idle', 'checking', 'available', 'not-available', 'downloading', 'downloaded', 'error', 'disabled']),
  version: z.string().nullable(),
  progress: z.number().nullable(),
  error: z.string().nullable(),
});
export type UpdaterStatus = z.infer<typeof UpdaterStatus>;

const Void = z.undefined();

export const IpcContract = {
  'settings:get': { req: Void, res: LauncherSettings },
  'settings:set': { req: LauncherSettingsPatch, res: LauncherSettings },
  'settings:reset': { req: z.object({ section: SettingsSection.optional() }), res: LauncherSettings },

  'auth:get-tokens': { req: Void, res: TokenPair.nullable() },
  'auth:set-tokens': { req: z.object({ tokens: TokenPair, persist: z.boolean() }), res: z.object({ secure: z.boolean() }) },
  'auth:clear': { req: Void, res: z.object({ ok: z.literal(true) }) },

  'game:validate-exe': { req: z.object({ path: z.string() }), res: ExeValidation },
  'game:pick-exe': { req: Void, res: ExeValidation.nullable() },
  'game:launch': { req: LaunchRequest, res: GameStatus },
  'game:kill': { req: Void, res: GameStatus },
  'game:status': { req: Void, res: GameStatus },

  'window:minimize': { req: Void, res: Void },
  'window:toggle-maximize': { req: Void, res: z.boolean() },
  'window:close': { req: Void, res: Void },
  'window:is-maximized': { req: Void, res: z.boolean() },
  'window:set-zoom': { req: z.object({ factor: z.number().min(0.8).max(1.25) }), res: Void },

  'system:info': { req: Void, res: SystemInfo },
  'system:open-path': { req: z.object({ target: z.enum(['logs', 'userData', 'themes', 'cache']) }), res: Void },
  'system:export-diagnostics': { req: z.object({ rendererState: z.record(z.unknown()) }), res: z.object({ path: z.string().nullable() }) },
  'system:reset-launcher': { req: Void, res: Void },
  'system:clear-cache': { req: Void, res: z.object({ freedBytes: z.number() }) },
  'system:pick-file': {
    req: z.object({ title: z.string(), filters: z.array(z.object({ name: z.string(), extensions: z.array(z.string()) })) }),
    res: z.string().nullable(),
  },
  'system:pick-directory': { req: z.object({ title: z.string() }), res: z.string().nullable() },
  'system:read-image': { req: z.object({ path: z.string() }), res: z.string().nullable() },
  'system:notify': { req: z.object({ title: z.string(), body: z.string() }), res: Void },

  'net:ping-regions': {
    req: z.object({ targets: z.array(z.object({ region: Region, host: z.string(), port: z.number().int() })) }),
    res: z.array(RegionPing),
  },
  'net:test-backend': {
    req: z.object({ url: z.string().url() }),
    res: z.object({ ok: z.boolean(), ms: z.number().nullable(), version: z.string().nullable(), error: z.string().nullable() }),
  },

  'themes:list-community': { req: Void, res: z.array(ThemeDefinition) },
  'themes:save-community': { req: ThemeDefinition, res: z.object({ path: z.string() }) },
  'themes:export': { req: ThemeDefinition, res: z.object({ path: z.string().nullable() }) },
  'themes:import': { req: Void, res: ThemeDefinition.nullable() },

  'updater:check': { req: Void, res: UpdaterStatus },
  'updater:install': { req: Void, res: Void },

  'log:write': {
    req: z.object({ level: z.enum(['error', 'warn', 'info', 'debug']), message: z.string().max(4000), context: z.record(z.unknown()).optional() }),
    res: Void,
  },
} as const;

export type IpcChannel = keyof typeof IpcContract;
export type IpcRequest<C extends IpcChannel> = z.input<(typeof IpcContract)[C]['req']>;
export type IpcResponse<C extends IpcChannel> = z.infer<(typeof IpcContract)[C]['res']>;
export const IPC_CHANNELS = Object.keys(IpcContract) as IpcChannel[];

/** Main → renderer push events. */
export const IpcEvents = {
  'game:status': GameStatus,
  'updater:status': UpdaterStatus,
  'window:maximized': z.boolean(),
} as const;
export type IpcEvent = keyof typeof IpcEvents;
export type IpcEventPayload<E extends IpcEvent> = z.infer<(typeof IpcEvents)[E]>;
export const IPC_EVENTS = Object.keys(IpcEvents) as IpcEvent[];

export class IpcValidationError extends Error {
  constructor(
    public readonly channel: string,
    public readonly direction: 'request' | 'response' | 'event',
    public readonly issues: z.ZodIssue[],
  ) {
    super(
      `IPC ${direction} validation failed on "${channel}": ${issues
        .map((i) => `${i.path.join('.') || '(root)'} ${i.message}`)
        .join('; ')}`,
    );
    this.name = 'IpcValidationError';
  }
}
