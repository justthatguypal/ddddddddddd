/**
 * Bot identity generation: gamer-tag handles + Season-3-legal loadouts.
 *
 * Handles are composed from base words, prefixes/suffixes and leetspeak, then run through a
 * profanity filter (leet-normalized) and a collision check so a pool of 400+ unique, clean
 * names is reproducible from a seed.
 */
import type { Rarity } from '@ogfn/shared-types';
import { COSMETICS, type CatalogEntry } from './cosmetics.js';
import { createRng, type Rng } from './rng.js';

const BASE_WORDS = [
  'Shadow', 'Blaze', 'Viper', 'Ghost', 'Frost', 'Nova', 'Raptor', 'Storm', 'Pixel', 'Turbo', 'Nitro', 'Ninja',
  'Sniper', 'Rogue', 'Venom', 'Phantom', 'Cobra', 'Falcon', 'Titan', 'Wolf', 'Hawk', 'Reaper', 'Comet', 'Meteor',
  'Rocket', 'Llama', 'Taco', 'Noodle', 'Pickle', 'Waffle', 'Bacon', 'Cactus', 'Panda', 'Koala', 'Sloth', 'Otter',
  'Goose', 'Moose', 'Duck', 'Banana', 'Muffin', 'Biscuit', 'Nugget', 'Sprout', 'Gizmo', 'Rascal', 'Bandit', 'Outlaw',
  'Ranger', 'Scout', 'Medic', 'Builder', 'Cranker', 'Editor', 'Boxer', 'Sweaty', 'Default', 'Noob', 'Pro', 'Clutch',
  'Cracked', 'Smurf', 'Tilted', 'Dusty', 'Greasy', 'Lucky', 'Retail', 'Salty', 'Snobby', 'Wailing', 'Anarchy', 'Moisty',
  'Loot', 'Chug', 'Slurp', 'Shield', 'Pump', 'Tac', 'Scar', 'Bolt', 'Drum', 'Mini', 'Bush', 'Crown', 'Victory',
  'Zero', 'Alpha', 'Omega', 'Delta', 'Echo', 'Bravo', 'Kilo', 'Zulu', 'Atlas', 'Orbit', 'Lunar', 'Solar', 'Plasma',
  'Static', 'Glitch', 'Lag', 'Ping', 'Frag', 'Spray', 'Flick', 'Scope', 'Crate', 'Chest', 'Vault', 'Bus', 'Glider',
  'Sky', 'Thunder', 'Lightning', 'Inferno', 'Arctic', 'Toxic', 'Savage', 'Silent', 'Rapid', 'Hyper', 'Mega', 'Ultra',
];
const PREFIXES = ['Xx_', 'TTV_', 'FaZe_', 'iAm', 'Its', 'The', 'Mr', 'Lil', 'Big', 'Not', 'Real', 'OG_', 'x', 'Kid'];
const SUFFIXES = ['_YT', '_TTV', '_xX', 'xX', 'HD', 'Gaming', 'Plays', 'FN', 'Jr', 'God', 'King', 'Main', '_OG', 'Pro', 'Bot'];
const LEET: Record<string, string> = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };

/** Deliberately small denylist; normalized against leetspeak and separators before matching. */
const PROFANITY = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'retard', 'rape', 'nazi', 'whore', 'slut', 'dick', 'cock', 'pussy', 'kkk', 'hitler'];

export function normalizeForFilter(name: string): string {
  const unleet: Record<string, string> = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't', '$': 's', '@': 'a' };
  return name
    .toLowerCase()
    .split('')
    .map((ch) => unleet[ch] ?? ch)
    .join('')
    .replace(/[^a-z]/g, '');
}

export function isProfane(name: string): boolean {
  const n = normalizeForFilter(name);
  return PROFANITY.some((w) => n.includes(w));
}

function leetify(word: string, rng: Rng, density: number): string {
  return word
    .split('')
    .map((ch) => {
      const l = LEET[ch.toLowerCase()];
      return l && rng.chance(density) ? l : ch;
    })
    .join('');
}

function composeHandle(rng: Rng): string {
  const pattern = rng.int(0, 7);
  const w1 = rng.pick(BASE_WORDS);
  const w2 = rng.pick(BASE_WORDS);
  const num = rng.chance(0.5) ? String(rng.pick([rng.int(1, 99), rng.int(100, 999), 69, 420, 2018, 1337, 7, 13])) : '';
  let name: string;
  switch (pattern) {
    case 0: name = `Xx_${w1}${w2}_xX`; break;
    case 1: name = `${rng.pick(PREFIXES)}${w1}${num}`; break;
    case 2: name = `${w1}${w2}${rng.pick(SUFFIXES)}`; break;
    case 3: name = `${leetify(w1 + w2, rng, 0.5)}${num}`; break;
    case 4: name = `${w1.toLowerCase()}_${w2.toLowerCase()}${num}`; break;
    case 5: name = `${rng.pick(PREFIXES)}${w1}${rng.pick(SUFFIXES)}`; break;
    case 6: name = `${w1}${num || rng.int(10, 99)}`; break;
    default: name = `${leetify(w1, rng, 0.7)}${rng.pick(SUFFIXES)}`;
  }
  return name.replace(/__+/g, '_').slice(0, 16);
}

export function generateHandles(count: number, seed: number | string = 'ogfn-bots', reserved: Iterable<string> = []): string[] {
  const rng = createRng(`handles:${seed}`);
  const seen = new Set<string>([...reserved].map((n) => n.toLowerCase()));
  const out: string[] = [];
  let guard = 0;
  while (out.length < count) {
    if (++guard > count * 200) throw new Error(`Could only generate ${out.length}/${count} unique handles`);
    const h = composeHandle(rng);
    if (h.length < 3 || isProfane(h) || seen.has(h.toLowerCase())) continue;
    seen.add(h.toLowerCase());
    out.push(h);
  }
  return out;
}

export interface BotLoadout {
  outfitId: string;
  backpackId: string | null;
  pickaxeId: string;
  gliderId: string;
  contrailId: string | null;
  emoteId: string;
}

/** Realistic 2018 lobby: lots of defaults/uncommons, rare legendaries. */
export const DEFAULT_SKIN_RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 30, uncommon: 30, rare: 20, epic: 12, legendary: 6, dark: 0.5, frozen: 0.5, lava: 0.5, shadow: 0.5, marvel: 0,
};

export function rollLoadout(
  rng: Rng,
  opts: { pool?: readonly string[]; rarityWeights?: Partial<Record<Rarity, number>>; maxSeason?: number } = {},
): BotLoadout {
  const maxSeason = opts.maxSeason ?? 3;
  const weights = { ...DEFAULT_SKIN_RARITY_WEIGHTS, ...opts.rarityWeights };
  const poolSet = opts.pool && opts.pool.length ? new Set(opts.pool) : null;
  const legal = COSMETICS.filter((c) => c.season <= maxSeason && (!poolSet || poolSet.has(c.id) || c.isDefault));
  const ofType = (t: CatalogEntry['type']) => legal.filter((c) => c.type === t);
  const pickWeighted = (items: CatalogEntry[]) => rng.weighted(items, (c) => weights[c.rarity] ?? 1);

  const outfit = pickWeighted(ofType('outfit'));
  const setBling = ofType('backpack').filter((b) => b.setName && b.setName === outfit.setName);
  const backpack = setBling.length && rng.chance(0.85) ? rng.pick(setBling) : rng.chance(0.6) ? pickWeighted(ofType('backpack')) : null;
  const pickaxe = rng.chance(0.35) ? legal.find((c) => c.name === 'Default Pickaxe')! : pickWeighted(ofType('pickaxe'));
  const glider = rng.chance(0.35) ? legal.find((c) => c.name === 'Default Glider')! : pickWeighted(ofType('glider'));
  const contrail = rng.chance(0.4) ? pickWeighted(ofType('contrail')) : null;
  const emote = pickWeighted(ofType('emote').filter((e) => e.name !== 'Thank the Bus Driver'));
  return {
    outfitId: outfit.id,
    backpackId: backpack?.id ?? null,
    pickaxeId: pickaxe.id,
    gliderId: glider.id,
    contrailId: contrail?.id ?? null,
    emoteId: emote.id,
  };
}

export interface BotIdentity extends BotLoadout {
  handle: string;
}

export function generateBotIdentities(count: number, seed: number | string = 'ogfn-bots'): BotIdentity[] {
  const handles = generateHandles(count, seed);
  const rng = createRng(`loadouts:${seed}`);
  return handles.map((handle) => ({ handle, ...rollLoadout(rng) }));
}
