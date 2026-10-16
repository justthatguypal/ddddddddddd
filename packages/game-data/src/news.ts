/** Deterministic news generator used by the seed script and the launcher's offline mode. */
import type { NewsArticle, NewsCategory } from '@ogfn/shared-types';
import { createRng } from './rng.js';

interface Template {
  category: NewsCategory;
  title: string;
  excerpt: string;
  tags: string[];
  body: (n: number) => string;
}

const TEMPLATES: Template[] = [
  {
    category: 'PATCH_NOTES',
    title: 'v3.{n} Patch Notes',
    excerpt: 'Weapon tuning, building fixes, and a fresh round of bot behavior improvements.',
    tags: ['patch', 'balance', 'bots'],
    body: (n) => `## Overview
Patch **v3.${n}** focuses on combat feel and bot fairness.

## Weapons
- Assault Rifle (Rare) damage **31 → 32**
- Pump Shotgun pellet spread reduced slightly at range
- Hunting rifle headshot multiplier is now **2.5x**

## Bots
- Recruit bots now hesitate briefly before returning fire
- Elite bots will no longer panic-tower when out of materials
- Fixed an issue where squad bots occasionally ignored downed teammates

## Building
- Ramps placed on uneven terrain now snap more reliably
- Fixed a rare case where edit previews persisted after cancelling

## Known Issues
- Some players may see the meteor skybox flicker when alt-tabbing.`,
  },
  {
    category: 'EVENT',
    title: 'Meteor Watch Week {n}',
    excerpt: 'Something big is getting closer. Complete the weekly challenges before it lands.',
    tags: ['event', 'meteor', 'challenges'],
    body: (n) => `## The sky is falling
Astronomers on the island have spotted the comet again — **week ${n}** of Meteor Watch begins now.

### This week's challenges
1. Deal damage with Assault Rifles to opponents (0/500)
2. Search chests in Dusty Depot (0/7)
3. Visit the Telescope locations in a single match (0/3)

> Rewards: 5 Battle Stars per challenge, and an exclusive loading screen for all three.

Stay safe out there. Keep your eyes up.`,
  },
  {
    category: 'SHOP',
    title: 'Shop Spotlight: Set #{n}',
    excerpt: 'A look at this week\'s featured outfits and bundles in the Item Shop.',
    tags: ['shop', 'cosmetics'],
    body: (n) => `## This week in the Item Shop
Spotlight **#${n}** brings back a fan favorite set alongside two brand-new Blast Off items.

| Item | Rarity | Price |
| --- | --- | --- |
| Meteor Marshal | Epic | 1,500 |
| Meteor Rider | Legendary | 1,500 |
| Plasma Trail | Epic | 500 |

*V-Bucks on this server are a local test ledger and are **not real currency**.*`,
  },
  {
    category: 'MAINTENANCE',
    title: 'Scheduled Maintenance #{n}',
    excerpt: 'Servers will be briefly unavailable while we roll out backend updates.',
    tags: ['maintenance', 'servers'],
    body: (n) => `## Downtime window
Maintenance **#${n}** is scheduled for **06:00 UTC** and should last about **30 minutes**.

- Matchmaking will be disabled 15 minutes before the window
- In-progress matches will be allowed to finish
- The Item Shop will remain browsable in read-only mode

Follow the launcher status strip for live updates.`,
  },
  {
    category: 'EVENT',
    title: 'Bot Bash Weekend {n}',
    excerpt: 'Double XP on bot-filled playlists, plus Champion-tier bots in the final circles.',
    tags: ['event', 'bots', 'xp'],
    body: (n) => `## Bot Bash is back
For weekend **${n}**, every bot-filled playlist awards **double XP**.

- Final-circle bots are boosted to **Elite** and **Champion** tiers
- Kill-feed bot tags are enabled so you can track your bot-elimination streaks
- Leaderboards reset Monday at 00:00 UTC`,
  },
];

const AUTHORS = ['The OGFN Team', 'Server Ops', 'Bot Lab', 'Community Team'];

export function generateNews(count: number, reference: Date = new Date(), salt = 'ogfn'): NewsArticle[] {
  const rng = createRng(`${salt}:news`);
  const out: NewsArticle[] = [];
  const perTemplate = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    const tIdx = i % TEMPLATES.length;
    const t = TEMPLATES[tIdx]!;
    const n = (perTemplate.get(tIdx) ?? 0) + 1;
    perTemplate.set(tIdx, n);
    const title = t.title.replace('{n}', String(n));
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const hoursAgo = i * 34 + rng.int(0, 10);
    out.push({
      slug,
      title,
      category: t.category,
      excerpt: t.excerpt,
      tags: t.tags,
      author: rng.pick(AUTHORS),
      publishedAt: new Date(reference.getTime() - hoursAgo * 3_600_000).toISOString(),
      thumbnailUrl: `placeholder://news/${t.category.toLowerCase()}/${(i % 6) + 1}`,
      heroUrl: `placeholder://news-hero/${t.category.toLowerCase()}`,
      body: t.body(n),
    });
  }
  return out;
}
