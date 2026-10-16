import { z } from 'zod';
import { IsoDate } from './common.js';
import { Cosmetic, CosmeticType } from './cosmetics.js';

export const InventoryItem = z.object({
  cosmeticId: z.string(),
  acquiredAt: IsoDate,
  favorite: z.boolean(),
  source: z.enum(['PURCHASE', 'GRANT', 'DEFAULT', 'GIFT']),
  cosmetic: Cosmetic,
});
export type InventoryItem = z.infer<typeof InventoryItem>;

export const EMOTE_SLOTS = 6;
export const PRESET_COUNT = 10;

export const LOADOUT_SLOTS = [
  'outfit',
  'backpack',
  'pickaxe',
  'glider',
  'contrail',
  'wrap',
  'emote0',
  'emote1',
  'emote2',
  'emote3',
  'emote4',
  'emote5',
] as const;
export const LoadoutSlot = z.enum(LOADOUT_SLOTS);
export type LoadoutSlot = z.infer<typeof LoadoutSlot>;

/** Which cosmetic type may occupy a slot. */
export function slotType(slot: LoadoutSlot): CosmeticType {
  return slot.startsWith('emote') ? 'emote' : (slot as CosmeticType);
}

export const Loadout = z.object({
  name: z.string().max(24),
  slots: z.record(LoadoutSlot, z.string().nullable()),
});
export type Loadout = z.infer<typeof Loadout>;

export const LoadoutState = z.object({
  activePreset: z.number().int().min(0).max(PRESET_COUNT - 1),
  presets: z.array(Loadout).length(PRESET_COUNT),
});
export type LoadoutState = z.infer<typeof LoadoutState>;

export function emptyLoadout(name: string): Loadout {
  return {
    name,
    slots: Object.fromEntries(LOADOUT_SLOTS.map((s) => [s, null])) as Record<LoadoutSlot, null>,
  };
}

export const InventoryResponse = z.object({
  items: z.array(InventoryItem),
  loadout: LoadoutState,
});
export type InventoryResponse = z.infer<typeof InventoryResponse>;

export const EquipBody = z.object({
  presetIndex: z.number().int().min(0).max(PRESET_COUNT - 1).optional(),
  slot: LoadoutSlot,
  cosmeticId: z.string().nullable(),
});
export type EquipBody = z.infer<typeof EquipBody>;

export const PresetBody = z.object({
  presetIndex: z.number().int().min(0).max(PRESET_COUNT - 1),
  name: z.string().trim().min(1).max(24).optional(),
  activate: z.boolean().optional(),
});
export type PresetBody = z.infer<typeof PresetBody>;

export const FavoriteBody = z.object({ cosmeticId: z.string(), favorite: z.boolean() });
export type FavoriteBody = z.infer<typeof FavoriteBody>;
