/**
 * Daily Item Shop rotation engine.
 *
 * ADR: Rotations are a pure function of (date, catalog, salt). That makes them reproducible
 * (the seed can pre-generate 14 days, the server can lazily generate tomorrow, and offline mode
 * shows the same shop), while the backend persists the generated rows so an admin can edit a
 * rotation without the engine overwriting it.
 */
import { RARITY_RANK } from '@ogfn/shared-types';
import { basePrice, type CatalogEntry } from './cosmetics.js';
import { createRng } from './rng.js';

export interface GeneratedOffer {
  /** Stable within a rotation: `${date}:${section}:${index}`. */
  key: string;
  section: 'featured' | 'daily';
  title: string;
  itemIds: string[];
  price: number;
  regularPrice: number;
  isBundle: boolean;
  sortOrder: number;
}

export interface GeneratedRotation {
  date: string;
  startsAt: Date;
  endsAt: Date;
  offers: GeneratedOffer[];
}

export interface RotationOptions {
  resetHourUtc?: number;
  salt?: string;
  featuredCount?: number;
  dailyCount?: number;
  bundleDiscount?: number;
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The rotation date that is live at `now` given the reset hour. */
export function currentRotationDate(now: Date, resetHourUtc = 0): string {
  return toDateKey(new Date(now.getTime() - resetHourUtc * 3_600_000));
}

export function rotationBounds(date: string, resetHourUtc = 0): { startsAt: Date; endsAt: Date } {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const startsAt = new Date(Date.UTC(y, m - 1, d, resetHourUtc));
  return { startsAt, endsAt: new Date(startsAt.getTime() + 86_400_000) };
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return toDateKey(new Date(Date.UTC(y, m - 1, d + days)));
}

const roundPrice = (n: number) => Math.round(n / 100) * 100;

export function generateRotation(
  date: string,
  catalog: readonly CatalogEntry[],
  opts: RotationOptions = {},
): GeneratedRotation {
  const { resetHourUtc = 0, salt = 'ogfn', featuredCount = 2, dailyCount = 6, bundleDiscount = 0.25 } = opts;
  const rng = createRng(`${salt}:shop:${date}`);
  const pool = catalog.filter((c) => c.shopEligible);
  const used = new Set<string>();
  const offers: GeneratedOffer[] = [];

  // Featured: epic/legendary/series outfits, bundled with same-set extras when available.
  const featuredCandidates = rng.shuffle(pool.filter((c) => c.type === 'outfit' && RARITY_RANK[c.rarity] >= 3));
  for (const hero of featuredCandidates) {
    if (offers.length >= featuredCount) break;
    if (used.has(hero.id)) continue;
    used.add(hero.id);
    const setItems = hero.setName
      ? pool.filter((c) => c.setName === hero.setName && c.id !== hero.id && c.type !== 'outfit' && !used.has(c.id))
      : [];
    const asBundle = setItems.length > 0 && rng.chance(0.6);
    const items = asBundle ? [hero, ...setItems.slice(0, 3)] : [hero];
    items.forEach((i) => used.add(i.id));
    const regularPrice = items.reduce((sum, i) => sum + basePrice(i), 0);
    offers.push({
      key: `${date}:featured:${offers.length}`,
      section: 'featured',
      title: asBundle ? `${hero.setName} Bundle` : hero.name,
      itemIds: items.map((i) => i.id),
      price: asBundle ? roundPrice(regularPrice * (1 - bundleDiscount)) : regularPrice,
      regularPrice,
      isBundle: asBundle,
      sortOrder: offers.length,
    });
  }

  // Daily: weighted toward uncommon/rare outfits, with a type mix like the 2018 shop.
  const slotTypes: CatalogEntry['type'][] = rng.shuffle(['outfit', 'outfit', 'pickaxe', 'glider', 'emote', 'emote', 'backpack', 'wrap', 'contrail']).slice(0, dailyCount);
  let i = 0;
  for (const type of slotTypes) {
    const candidates = pool.filter((c) => c.type === type && !used.has(c.id));
    const fallback = pool.filter((c) => !used.has(c.id));
    const choice = rng.weighted(candidates.length ? candidates : fallback, (c) => [3, 5, 4, 2, 1][RARITY_RANK[c.rarity]] ?? 1);
    used.add(choice.id);
    const price = basePrice(choice);
    offers.push({
      key: `${date}:daily:${i}`,
      section: 'daily',
      title: choice.name,
      itemIds: [choice.id],
      price,
      regularPrice: price,
      isBundle: false,
      sortOrder: i++,
    });
  }

  return { date, ...rotationBounds(date, resetHourUtc), offers };
}
