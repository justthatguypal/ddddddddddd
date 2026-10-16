/**
 * ADR: The catalog is source-controlled TypeScript rather than a DB-only table so the backend
 * seed, the launcher's offline mode and the bot cosmetic roller agree byte-for-byte without a
 * network round trip. The backend still owns the authoritative copy at runtime (seeded into
 * Postgres); this file is only the seed source.
 *
 * Names are text only. No Epic art is shipped — every render points at a PLACEHOLDER_ asset.
 */
import type { Cosmetic, CosmeticType, Rarity } from '@ogfn/shared-types';
import { RARITY_RANK } from '@ogfn/shared-types';

type Row = [name: string, type: CosmeticType, rarity: Rarity, set: string | null, season: number, description?: string];

const ROWS: Row[] = [
  // ── Outfits (40) ─────────────────────────────────────────────
  ['Rust Lord', 'outfit', 'legendary', 'Scrap Kings', 3, 'Ruler of the wasteland.'],
  ['Elite Agent', 'outfit', 'legendary', 'Agent', 3, 'Mission accepted.'],
  ['Dark Voyager', 'outfit', 'legendary', 'Space Explorers', 3, 'Into the unknown.'],
  ['The Reaper', 'outfit', 'legendary', 'Hitman', 3, 'Retired... until now.'],
  ['Raven', 'outfit', 'legendary', 'Feathered Fiends', 3, 'Darkness rises.'],
  ['Rex', 'outfit', 'legendary', 'Jurassic', 3, 'Prehistoric prowess.'],
  ['Tricera Ops', 'outfit', 'legendary', 'Jurassic', 3, 'Three horns, zero mercy.'],
  ['Sparkle Specialist', 'outfit', 'epic', 'Disco Divas', 3, 'Bring the bling.'],
  ['Moonwalker', 'outfit', 'epic', 'Space Explorers', 3, 'One small step...'],
  ['Mission Specialist', 'outfit', 'epic', 'Space Explorers', 3, 'Calculated risk.'],
  ['Brite Bomber', 'outfit', 'epic', 'Brite Brigade', 2, 'Clear skies ahead.'],
  ['Black Knight', 'outfit', 'legendary', 'Royale Heroes', 2, 'Unstoppable.'],
  ['Blue Squire', 'outfit', 'rare', 'Royale Heroes', 2, 'Squire up.'],
  ['Royale Knight', 'outfit', 'rare', 'Royale Heroes', 2, 'For honor.'],
  ['Sergeant Jonesy', 'outfit', 'rare', null, 1, 'Ready for duty.'],
  ['Aerial Assault Trooper', 'outfit', 'rare', null, 1, 'First to the skies.'],
  ['Renegade Raider', 'outfit', 'rare', null, 1, 'Battle-hardened raider.'],
  ['Ghoul Trooper', 'outfit', 'epic', 'Haunted Legends', 1, 'Unspeakably undead.'],
  ['Skull Trooper', 'outfit', 'epic', 'Haunted Legends', 1, 'Fearless and spooky.'],
  ['Crackshot', 'outfit', 'legendary', 'Nutcracker', 2, 'Crack the competition.'],
  ['Red-Nosed Raider', 'outfit', 'rare', 'Yuletide Ranger', 2, 'Festive fury.'],
  ['Love Ranger', 'outfit', 'legendary', 'Heartbreaker', 3, 'Cupid has a crossbow.'],
  ['Cuddle Team Leader', 'outfit', 'legendary', 'Love Brigade', 3, 'Hug it out.'],
  ['Rose Team Leader', 'outfit', 'legendary', 'Love Brigade', 3, 'Thorns and all.'],
  ['Brilliant Striker', 'outfit', 'epic', 'Soccer', 3, 'Back of the net.'],
  ['Scarlet Defender', 'outfit', 'uncommon', 'Mainframe', 3, 'Stand your ground.'],
  ['Tactics Officer', 'outfit', 'uncommon', null, 3, 'Plan the drop.'],
  ['Trailblazer', 'outfit', 'uncommon', null, 3, 'Find a new path.'],
  ['Rogue Agent', 'outfit', 'uncommon', 'Agent', 3, 'Off the grid.'],
  ['Rook', 'outfit', 'uncommon', null, 3, 'Fresh off the bus.'],
  ['Desperado', 'outfit', 'uncommon', 'Gunslingers', 3, 'Quickest draw on the island.'],
  ['Tower Recon Specialist', 'outfit', 'rare', null, 3, 'Eyes on Tilted.'],
  ['Meteor Marshal', 'outfit', 'epic', 'Blast Off', 3, 'Keeps the peace beneath the falling sky.'],
  ['Plasma Courier', 'outfit', 'rare', 'Blast Off', 3, 'Express delivery from orbit.'],
  ['Crater Scout', 'outfit', 'uncommon', 'Blast Off', 3, 'First on scene at every impact.'],
  ['Comet Cadet', 'outfit', 'common', 'Blast Off', 3, 'Trainee of the stars.'],
  ['Night Shift', 'outfit', 'dark', 'Dark Series', 3, 'Made for the after-hours.'],
  ['Glacier Guard', 'outfit', 'frozen', 'Frozen Series', 3, 'Cold as the storm eye.'],
  ['Magma Marauder', 'outfit', 'lava', 'Lava Series', 3, 'Erupts on contact.'],
  ['Void Warden', 'outfit', 'shadow', 'Shadow Series', 3, 'Watches from between moments.'],
  // ── Back Bling (18) ──────────────────────────────────────────
  ['Rust Bucket', 'backpack', 'legendary', 'Scrap Kings', 3],
  ['Covert Cape', 'backpack', 'epic', 'Agent', 3],
  ['Void Jetpack', 'backpack', 'epic', 'Space Explorers', 3],
  ['Lunar Lander', 'backpack', 'rare', 'Space Explorers', 3],
  ['Dark Wings', 'backpack', 'legendary', 'Feathered Fiends', 3],
  ['Fossil Pack', 'backpack', 'rare', 'Jurassic', 3],
  ['Black Shield', 'backpack', 'epic', 'Royale Heroes', 2],
  ['Royal Shield', 'backpack', 'rare', 'Royale Heroes', 2],
  ['Lucky', 'backpack', 'uncommon', null, 3],
  ['Cuddle Pack', 'backpack', 'epic', 'Love Brigade', 3],
  ['Rose Pack', 'backpack', 'epic', 'Love Brigade', 3],
  ['Heartbreak Quiver', 'backpack', 'rare', 'Heartbreaker', 3],
  ['Disco Ball Pack', 'backpack', 'rare', 'Disco Divas', 3],
  ['Meteor Shard Pack', 'backpack', 'epic', 'Blast Off', 3],
  ['Orbital Satchel', 'backpack', 'uncommon', 'Blast Off', 3],
  ['Crater Kit', 'backpack', 'common', 'Blast Off', 3],
  ['Fresh Coat', 'backpack', 'uncommon', 'Mainframe', 3],
  ['Eclipse Pack', 'backpack', 'shadow', 'Shadow Series', 3],
  // ── Harvesting Tools (18) ────────────────────────────────────
  ['Default Pickaxe', 'pickaxe', 'common', null, 1, 'Standard issue.'],
  ['Pulse Axe', 'pickaxe', 'rare', null, 1],
  ['AC/DC', 'pickaxe', 'rare', null, 2],
  ['Raider\'s Revenge', 'pickaxe', 'epic', null, 1],
  ['Reaper', 'pickaxe', 'epic', 'Hitman', 3],
  ['Crowbar', 'pickaxe', 'uncommon', null, 3],
  ['Pick Squeak', 'pickaxe', 'uncommon', null, 3],
  ['Raven Beak', 'pickaxe', 'epic', 'Feathered Fiends', 3],
  ['Bone Wand', 'pickaxe', 'rare', 'Jurassic', 3],
  ['Cuddle Axe', 'pickaxe', 'rare', 'Love Brigade', 3],
  ['Disco Brawl', 'pickaxe', 'epic', 'Disco Divas', 3],
  ['Sloth Axe', 'pickaxe', 'uncommon', null, 3],
  ['Lucky Pick', 'pickaxe', 'uncommon', null, 3],
  ['Stellar Axe', 'pickaxe', 'rare', 'Space Explorers', 3],
  ['Meteor Hammer', 'pickaxe', 'legendary', 'Blast Off', 3],
  ['Crater Crusher', 'pickaxe', 'rare', 'Blast Off', 3],
  ['Ice Pick', 'pickaxe', 'frozen', 'Frozen Series', 3],
  ['Molten Mattock', 'pickaxe', 'lava', 'Lava Series', 3],
  // ── Gliders (16) ─────────────────────────────────────────────
  ['Default Glider', 'glider', 'common', null, 1, 'Gets you there.'],
  ['Mako', 'glider', 'rare', null, 1],
  ['Aerial Assault One', 'glider', 'rare', null, 1],
  ['Raven Glider', 'glider', 'legendary', 'Feathered Fiends', 3],
  ['Covert Ops', 'glider', 'epic', 'Agent', 3],
  ['Rocketeer', 'glider', 'epic', 'Space Explorers', 3],
  ['Discovery', 'glider', 'rare', 'Space Explorers', 3],
  ['Dino Glider', 'glider', 'epic', 'Jurassic', 3],
  ['Cozy Cart', 'glider', 'uncommon', null, 3],
  ['Snowflake', 'glider', 'uncommon', 'Yuletide Ranger', 2],
  ['Sir Glider the Brave', 'glider', 'epic', 'Royale Heroes', 2],
  ['Love Glider', 'glider', 'rare', 'Love Brigade', 3],
  ['Meteor Rider', 'glider', 'legendary', 'Blast Off', 3],
  ['Retro Rocket', 'glider', 'rare', 'Blast Off', 3],
  ['Pluto Paraglider', 'glider', 'uncommon', 'Blast Off', 3],
  ['Arc Reactor', 'glider', 'marvel', 'Marvel Series', 3],
  // ── Emotes (16) ──────────────────────────────────────────────
  ['Dance Moves', 'emote', 'common', null, 1, 'The default groove.'],
  ['Thank the Bus Driver', 'emote', 'common', null, 3, 'Always be polite.'],
  ['Floss', 'emote', 'epic', null, 2],
  ['Take the L', 'emote', 'epic', null, 3],
  ['Orange Justice', 'emote', 'epic', null, 3],
  ['Fresh', 'emote', 'rare', null, 3],
  ['Disco Fever', 'emote', 'epic', 'Disco Divas', 3],
  ['Hype', 'emote', 'rare', null, 3],
  ['Groove Jam', 'emote', 'rare', null, 3],
  ['Wave', 'emote', 'uncommon', null, 1],
  ['Salute', 'emote', 'uncommon', null, 1],
  ['Slow Clap', 'emote', 'uncommon', null, 1],
  ['Ride the Pony', 'emote', 'rare', null, 1],
  ['Rocket Rodeo', 'emote', 'legendary', 'Blast Off', 3],
  ['Moon Bounce', 'emote', 'rare', 'Blast Off', 3],
  ['Impact Pose', 'emote', 'uncommon', 'Blast Off', 3],
  // ── Contrails (6) ────────────────────────────────────────────
  ['Plasma Trail', 'contrail', 'epic', 'Blast Off', 3],
  ['Meteor Tail', 'contrail', 'legendary', 'Blast Off', 3],
  ['Stardust', 'contrail', 'rare', 'Space Explorers', 3],
  ['Hearts', 'contrail', 'rare', 'Love Brigade', 3],
  ['Smoke Signal', 'contrail', 'uncommon', null, 3],
  ['Spectral Mist', 'contrail', 'uncommon', 'Haunted Legends', 3],
  // ── Wraps (6) ────────────────────────────────────────────────
  ['Starfield', 'wrap', 'rare', 'Blast Off', 3],
  ['Molten Core', 'wrap', 'epic', 'Blast Off', 3],
  ['Camo Grid', 'wrap', 'uncommon', null, 3],
  ['Rustworks', 'wrap', 'rare', 'Scrap Kings', 3],
  ['Permafrost', 'wrap', 'frozen', 'Frozen Series', 3],
  ['Neon Night', 'wrap', 'dark', 'Dark Series', 3],
];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Items every account owns from the start and that never appear in the shop. */
export const DEFAULT_COSMETIC_NAMES = new Set(['Default Pickaxe', 'Default Glider', 'Dance Moves', 'Comet Cadet']);

export interface CatalogEntry extends Cosmetic {
  /** Shop-eligible (defaults and battle-pass-only items are not). */
  shopEligible: boolean;
  isDefault: boolean;
}

const BATTLE_PASS_ONLY = new Set(['Rust Lord', 'Elite Agent', 'Dark Voyager', 'The Reaper', 'Moonwalker', 'Mission Specialist', 'Black Knight', 'Blue Squire', 'Royale Knight', 'Sparkle Specialist', 'Rust Bucket', 'Covert Cape', 'Void Jetpack', 'Black Shield', 'Royal Shield', 'Reaper', 'Rocketeer', 'Covert Ops']);

export const COSMETICS: readonly CatalogEntry[] = ROWS.map(([name, type, rarity, setName, season, description]) => {
  const id = `${type}_${slugify(name)}`;
  const isDefault = DEFAULT_COSMETIC_NAMES.has(name);
  return {
    id,
    name,
    description: description ?? `${RARITY_RANK[rarity] >= 3 ? 'A prized' : 'A classic'} ${type === 'backpack' ? 'back bling' : type}${setName ? ` from the ${setName} set` : ''}.`,
    type,
    rarity,
    setName,
    imageUrl: `placeholder://cosmetic/${type}/${rarity}/${id}`,
    season,
    gameAssetId: null,
    isDefault,
    shopEligible: !isDefault && !BATTLE_PASS_ONLY.has(name),
  };
});

export const COSMETICS_BY_ID: ReadonlyMap<string, CatalogEntry> = new Map(COSMETICS.map((c) => [c.id, c]));

export function getCosmetic(id: string): CatalogEntry {
  const c = COSMETICS_BY_ID.get(id);
  if (!c) throw new Error(`Unknown cosmetic ${id}`);
  return c;
}

/** Strip catalog-only fields to the public API shape. */
export function toPublicCosmetic(c: CatalogEntry): Cosmetic {
  const { shopEligible: _s, isDefault: _d, ...rest } = c;
  return rest;
}

const PRICE_TABLE: Record<CosmeticType, [common: number, uncommon: number, rare: number, epic: number, legendary: number]> = {
  outfit: [500, 800, 1200, 1500, 2000],
  backpack: [200, 300, 400, 600, 800],
  pickaxe: [300, 500, 800, 1200, 1500],
  glider: [300, 500, 800, 1200, 1500],
  emote: [100, 200, 500, 800, 1000],
  wrap: [200, 300, 500, 700, 900],
  contrail: [200, 300, 400, 500, 700],
};

export function basePrice(c: Pick<Cosmetic, 'type' | 'rarity'>): number {
  return PRICE_TABLE[c.type][RARITY_RANK[c.rarity]]!;
}
