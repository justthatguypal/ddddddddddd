import { z } from 'zod';
import { IsoDate } from './common.js';
import { Cosmetic } from './cosmetics.js';

export const ShopSection = z.enum(['featured', 'daily']);
export type ShopSection = z.infer<typeof ShopSection>;

export const ShopOffer = z.object({
  id: z.string(),
  section: ShopSection,
  title: z.string(),
  price: z.number().int().nonnegative(),
  regularPrice: z.number().int().nonnegative(),
  isBundle: z.boolean(),
  items: z.array(Cosmetic).min(1),
  /** True when the caller already owns every item in the offer. */
  owned: z.boolean(),
});
export type ShopOffer = z.infer<typeof ShopOffer>;

export const ShopRotation = z.object({
  id: z.string(),
  /** UTC calendar date of the rotation, YYYY-MM-DD. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startsAt: IsoDate,
  endsAt: IsoDate,
  featured: z.array(ShopOffer),
  daily: z.array(ShopOffer),
});
export type ShopRotation = z.infer<typeof ShopRotation>;

export const ShopHistoryItem = z.object({
  id: z.string(),
  date: z.string(),
  offerCount: z.number().int(),
  headline: z.string(),
});

export const PurchaseBody = z.object({
  offerId: z.string(),
  /** Price the client displayed; a mismatch fails with PRICE_CHANGED rather than surprise-charging. */
  expectedPrice: z.number().int().nonnegative(),
});
export type PurchaseBody = z.infer<typeof PurchaseBody>;

export const PurchaseResult = z.object({
  purchaseId: z.string(),
  offerId: z.string(),
  pricePaid: z.number().int(),
  balance: z.number().int(),
  granted: z.array(z.string()),
  /** True when this response was replayed from an earlier request with the same idempotency key. */
  replayed: z.boolean(),
});
export type PurchaseResult = z.infer<typeof PurchaseResult>;

export const GiftBody = PurchaseBody.extend({
  recipientDisplayName: z.string().min(3).max(16),
  message: z.string().max(140).optional(),
});
export type GiftBody = z.infer<typeof GiftBody>;
