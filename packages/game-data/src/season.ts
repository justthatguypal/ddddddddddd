/**
 * Season clock.
 *
 * ADR: The original Season 3 ran 2018-02-22 → 2018-04-30 (~10 weeks). A private server
 * that hard-coded those dates would show "season over" forever, so by default the season
 * is a rolling 70-day window anchored at the original start date. Self-hosters can pin real
 * dates with SEASON_START / SEASON_END on the backend.
 */
export const SEASON_NUMBER = 3;
export const SEASON_NAME = 'Blast Off';
export const DEFAULT_BUILD_VERSION = '3.6-CL-4019403';
export const SEASON_ANCHOR = Date.UTC(2018, 1, 22, 9, 0, 0);
export const SEASON_LENGTH_DAYS = 70;
const DAY = 86_400_000;

export interface SeasonWindow {
  number: number;
  name: string;
  startsAt: Date;
  endsAt: Date;
}

export function seasonWindow(
  now: Date = new Date(),
  override?: { startsAt?: Date | null; endsAt?: Date | null },
): SeasonWindow {
  if (override?.startsAt && override?.endsAt) {
    return { number: SEASON_NUMBER, name: SEASON_NAME, startsAt: override.startsAt, endsAt: override.endsAt };
  }
  const len = SEASON_LENGTH_DAYS * DAY;
  const cycles = Math.floor((now.getTime() - SEASON_ANCHOR) / len);
  const start = SEASON_ANCHOR + cycles * len;
  return { number: SEASON_NUMBER, name: SEASON_NAME, startsAt: new Date(start), endsAt: new Date(start + len) };
}

export function seasonProgress(win: { startsAt: Date | string; endsAt: Date | string }, now: Date = new Date()) {
  const start = new Date(win.startsAt).getTime();
  const end = new Date(win.endsAt).getTime();
  const t = Math.min(Math.max(now.getTime(), start), end);
  return {
    week: Math.floor((t - start) / (7 * DAY)) + 1,
    totalWeeks: Math.ceil((end - start) / (7 * DAY)),
    msRemaining: Math.max(0, end - now.getTime()),
    daysRemaining: Math.max(0, Math.ceil((end - now.getTime()) / DAY)),
  };
}

/** Parses "3.6-CL-4019403"-style versions (also "++Fortnite+Release-3.6-CL-4019403"). */
export function parseBuildVersion(input: string): { season: number; patch: string; changelist: number } | null {
  const m = /(?:Release-)?(\d+)\.(\d+)(?:\.\d+)?-CL-(\d{6,8})/.exec(input);
  if (!m) return null;
  return { season: Number(m[1]), patch: `${m[1]}.${m[2]}`, changelist: Number(m[3]) };
}

/** Known Season 3 changelists (for build validation hints only). */
export const KNOWN_S3_BUILDS: Record<number, string> = {
  3807424: '3.0',
  3825894: '3.1',
  3841827: '3.2',
  3870737: '3.3',
  3889387: '3.4',
  3901517: '3.5',
  4019403: '3.6',
};
