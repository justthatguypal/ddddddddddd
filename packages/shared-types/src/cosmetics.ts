import { z } from 'zod';

export const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'dark',
  'frozen',
  'lava',
  'shadow',
  'marvel',
] as const;
export const Rarity = z.enum(RARITIES);
export type Rarity = z.infer<typeof Rarity>;

/** Canonical rarity colors (spec §3.4). The UI derives gradients from these. */
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#B2B2B2',
  uncommon: '#5ACD5A',
  rare: '#4C7BFF',
  epic: '#A855F7',
  legendary: '#FF8C1A',
  dark: '#FF3B6B',
  frozen: '#7FE7FF',
  lava: '#FF5A1F',
  shadow: '#6B21A8',
  marvel: '#E62429',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  dark: 'Dark Series',
  frozen: 'Frozen Series',
  lava: 'Lava Series',
  shadow: 'Shadow Series',
  marvel: 'Marvel Series',
};

/** Ordinal used for sorting / "better than" comparisons. Series rarities rank at epic+. */
export const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  dark: 3,
  frozen: 3,
  lava: 3,
  shadow: 3,
  marvel: 4,
};

export const COSMETIC_TYPES = [
  'outfit',
  'backpack',
  'pickaxe',
  'glider',
  'emote',
  'wrap',
  'contrail',
] as const;
export const CosmeticType = z.enum(COSMETIC_TYPES);
export type CosmeticType = z.infer<typeof CosmeticType>;

export const COSMETIC_TYPE_LABELS: Record<CosmeticType, string> = {
  outfit: 'Outfit',
  backpack: 'Back Bling',
  pickaxe: 'Harvesting Tool',
  glider: 'Glider',
  emote: 'Emote',
  wrap: 'Wrap',
  contrail: 'Contrail',
};

export const Cosmetic = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: CosmeticType,
  rarity: Rarity,
  setName: z.string().nullable(),
  /** Relative asset path. Until real art is supplied this is a PLACEHOLDER_ render. */
  imageUrl: z.string(),
  season: z.number().int(),
  /** Optional client-side asset identifier the user maps to their own build. */
  gameAssetId: z.string().nullable(),
});
export type Cosmetic = z.infer<typeof Cosmetic>;
