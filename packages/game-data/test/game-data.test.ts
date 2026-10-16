import { describe, expect, it } from 'vitest';
import { RARITY_RANK } from '@ogfn/shared-types';
import {
  COSMETICS,
  generateBotIdentities,
  generateHandles,
  generateNews,
  generateRotation,
  isProfane,
  parseBuildVersion,
  seasonProgress,
  seasonWindow,
  currentRotationDate,
  addDays,
} from '../src/index.js';

describe('catalog', () => {
  it('has 120 unique cosmetics', () => {
    expect(COSMETICS).toHaveLength(120);
    expect(new Set(COSMETICS.map((c) => c.id)).size).toBe(120);
  });
});

describe('rotation engine', () => {
  it('is deterministic per date', () => {
    const a = generateRotation('2026-03-01', COSMETICS);
    const b = generateRotation('2026-03-01', COSMETICS);
    expect(a).toEqual(b);
    expect(generateRotation('2026-03-02', COSMETICS)).not.toEqual(a);
  });

  it('produces 2 featured + 6 daily offers with no duplicate items', () => {
    for (let d = 0; d < 30; d++) {
      const r = generateRotation(addDays('2026-01-01', d), COSMETICS);
      expect(r.offers.filter((o) => o.section === 'featured')).toHaveLength(2);
      expect(r.offers.filter((o) => o.section === 'daily')).toHaveLength(6);
      const ids = r.offers.flatMap((o) => o.itemIds);
      expect(new Set(ids).size).toBe(ids.length);
      for (const o of r.offers) {
        expect(o.price).toBeGreaterThan(0);
        expect(o.price).toBeLessThanOrEqual(o.regularPrice);
        if (o.isBundle) expect(o.itemIds.length).toBeGreaterThan(1);
      }
      const featuredHero = COSMETICS.find((c) => c.id === r.offers[0]!.itemIds[0])!;
      expect(RARITY_RANK[featuredHero.rarity]).toBeGreaterThanOrEqual(3);
    }
  });

  it('respects the reset hour', () => {
    expect(currentRotationDate(new Date('2026-05-10T01:00:00Z'), 0)).toBe('2026-05-10');
    expect(currentRotationDate(new Date('2026-05-10T01:00:00Z'), 2)).toBe('2026-05-09');
  });
});

describe('news generator', () => {
  it('generates 60 unique slugs', () => {
    const news = generateNews(60, new Date('2026-06-01T00:00:00Z'));
    expect(new Set(news.map((n) => n.slug)).size).toBe(60);
  });
});

describe('bot identities', () => {
  it('generates 500 unique, clean handles reproducibly', () => {
    const a = generateHandles(500, 7);
    expect(new Set(a.map((h) => h.toLowerCase())).size).toBe(500);
    expect(a.some(isProfane)).toBe(false);
    expect(generateHandles(500, 7)).toEqual(a);
  });

  it('filters leetspeak profanity', () => {
    expect(isProfane('xX_5h1t_Xx')).toBe(true);
    expect(isProfane('MeteorMarshal')).toBe(false);
  });

  it('rolls mostly common/uncommon outfits', () => {
    const ids = generateBotIdentities(500, 'dist');
    const ranks = ids.map((i) => RARITY_RANK[COSMETICS.find((c) => c.id === i.outfitId)!.rarity]);
    const low = ranks.filter((r) => r <= 1).length / ranks.length;
    const legendary = ranks.filter((r) => r === 4).length / ranks.length;
    expect(low).toBeGreaterThan(0.35);
    expect(legendary).toBeLessThan(0.15);
  });
});

describe('season clock', () => {
  it('always yields a live window', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    const w = seasonWindow(now);
    expect(w.startsAt.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(w.endsAt.getTime()).toBeGreaterThan(now.getTime());
    const p = seasonProgress(w, now);
    expect(p.week).toBeGreaterThanOrEqual(1);
    expect(p.week).toBeLessThanOrEqual(10);
  });

  it('parses build versions', () => {
    expect(parseBuildVersion('++Fortnite+Release-3.6-CL-4019403')).toEqual({ season: 3, patch: '3.6', changelist: 4019403 });
    expect(parseBuildVersion('nope')).toBeNull();
  });
});
