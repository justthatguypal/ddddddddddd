/** Small, fast, deterministic PRNG utilities (no Math.random anywhere in game data). */

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Rng {
  /** Uniform [0, 1). */
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  range(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  shuffle<T>(arr: readonly T[]): T[];
  /** Standard normal via Box–Muller. */
  gaussian(): number;
  fork(label: string): Rng;
  readonly seed: number;
}

export function createRng(seed: number | string): Rng {
  const s = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  let state = s || 0x9e3779b9;
  let spare: number | null = null;
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    seed: s,
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (arr) => {
      if (arr.length === 0) throw new Error('pick() from empty array');
      return arr[Math.floor(next() * arr.length)]!;
    },
    weighted: (items, weight) => {
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      if (total <= 0) return rng.pick(items);
      let r = next() * total;
      for (const it of items) {
        r -= Math.max(0, weight(it));
        if (r < 0) return it;
      }
      return items[items.length - 1]!;
    },
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    gaussian: () => {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return v;
      }
      let u = 0;
      let v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      const mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(2 * Math.PI * v);
      return mag * Math.cos(2 * Math.PI * v);
    },
    fork: (label) => createRng(hashString(`${s}:${label}`)),
  };
  return rng;
}
