import { z } from 'zod';
import { IsoDate, PaginationQuery } from './common.js';

export const NEWS_CATEGORIES = ['PATCH_NOTES', 'EVENT', 'SHOP', 'MAINTENANCE'] as const;
export const NewsCategory = z.enum(NEWS_CATEGORIES);
export type NewsCategory = z.infer<typeof NewsCategory>;

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  PATCH_NOTES: 'Patch Notes',
  EVENT: 'Event',
  SHOP: 'Shop',
  MAINTENANCE: 'Maintenance',
};

export const NewsSummary = z.object({
  slug: z.string(),
  title: z.string(),
  category: NewsCategory,
  excerpt: z.string(),
  thumbnailUrl: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  publishedAt: IsoDate,
});
export type NewsSummary = z.infer<typeof NewsSummary>;

export const NewsArticle = NewsSummary.extend({
  heroUrl: z.string(),
  /** Markdown. Rendered + sanitized client-side. */
  body: z.string(),
});
export type NewsArticle = z.infer<typeof NewsArticle>;

export const NewsQuery = PaginationQuery.extend({
  category: NewsCategory.optional(),
  tag: z.string().max(32).optional(),
  q: z.string().max(80).optional(),
});
export type NewsQuery = z.infer<typeof NewsQuery>;

const Slug = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case slug');

export const NewsUpsertBody = z.object({
  slug: Slug,
  title: z.string().min(3).max(140),
  category: NewsCategory,
  excerpt: z.string().max(280),
  body: z.string().max(50_000),
  heroUrl: z.string().max(500),
  thumbnailUrl: z.string().max(500),
  author: z.string().max(64),
  tags: z.array(z.string().max(32)).max(10),
  publishedAt: IsoDate.optional(),
  published: z.boolean().default(true),
});
export type NewsUpsertBody = z.infer<typeof NewsUpsertBody>;
