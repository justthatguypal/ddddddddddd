import type { Cosmetic as DbCosmetic } from '@prisma/client';
import type { Cosmetic, EquipBody, InventoryResponse, LoadoutState, PresetBody } from '@ogfn/shared-types';
import { LoadoutState as LoadoutStateSchema, emptyLoadout, PRESET_COUNT, slotType } from '@ogfn/shared-types';
import { Errors } from '../../common/filters/errors.js';
import type { AppContext } from '../../context.js';

/** Sentinel cosmetic id meaning "roll a random owned item for this slot at match start". */
export const RANDOM_SLOT = 'random';

export function toCosmetic(c: DbCosmetic): Cosmetic {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    rarity: c.rarity,
    setName: c.setName,
    imageUrl: c.imageUrl,
    season: c.season,
    gameAssetId: c.gameAssetId,
  };
}

export class InventoryService {
  constructor(private readonly ctx: AppContext) {}

  private async loadoutOf(userId: string): Promise<LoadoutState> {
    const row = await this.ctx.db.loadoutState.findUnique({ where: { userId } });
    const parsed = LoadoutStateSchema.safeParse(row ? { activePreset: row.activePreset, presets: row.presets } : null);
    if (parsed.success) return parsed.data;
    // Repair missing/corrupt loadouts instead of failing the whole locker.
    return { activePreset: 0, presets: Array.from({ length: PRESET_COUNT }, (_, i) => emptyLoadout(`Preset ${i + 1}`)) };
  }

  async get(userId: string): Promise<InventoryResponse> {
    const items = await this.ctx.db.inventoryItem.findMany({
      where: { userId },
      include: { cosmetic: true },
      orderBy: [{ acquiredAt: 'desc' }],
    });
    return {
      items: items.map((i) => ({
        cosmeticId: i.cosmeticId,
        acquiredAt: i.acquiredAt.toISOString(),
        favorite: i.favorite,
        source: i.source,
        cosmetic: toCosmetic(i.cosmetic),
      })),
      loadout: await this.loadoutOf(userId),
    };
  }

  async equip(userId: string, body: EquipBody): Promise<LoadoutState> {
    const loadout = await this.loadoutOf(userId);
    const idx = body.presetIndex ?? loadout.activePreset;
    const preset = loadout.presets[idx];
    if (!preset) throw Errors.badRequest('Invalid preset');
    if (body.cosmeticId && body.cosmeticId !== RANDOM_SLOT) {
      const owned = await this.ctx.db.inventoryItem.findUnique({
        where: { userId_cosmeticId: { userId, cosmeticId: body.cosmeticId } },
        include: { cosmetic: true },
      });
      if (!owned) throw Errors.forbidden('You do not own that item');
      if (owned.cosmetic.type !== slotType(body.slot)) {
        throw Errors.badRequest(`A ${owned.cosmetic.type} cannot be equipped in the ${body.slot} slot`);
      }
    }
    preset.slots[body.slot] = body.cosmeticId;
    await this.save(userId, loadout);
    return loadout;
  }

  async updatePreset(userId: string, body: PresetBody): Promise<LoadoutState> {
    const loadout = await this.loadoutOf(userId);
    const preset = loadout.presets[body.presetIndex];
    if (!preset) throw Errors.badRequest('Invalid preset');
    if (body.name) preset.name = body.name;
    if (body.activate) loadout.activePreset = body.presetIndex;
    await this.save(userId, loadout);
    return loadout;
  }

  async favorite(userId: string, cosmeticId: string, favorite: boolean): Promise<void> {
    const res = await this.ctx.db.inventoryItem.updateMany({ where: { userId, cosmeticId }, data: { favorite } });
    if (res.count === 0) throw Errors.notFound('Inventory item');
  }

  private async save(userId: string, loadout: LoadoutState) {
    await this.ctx.db.loadoutState.upsert({
      where: { userId },
      update: { activePreset: loadout.activePreset, presets: loadout.presets },
      create: { userId, activePreset: loadout.activePreset, presets: loadout.presets },
    });
  }
}
