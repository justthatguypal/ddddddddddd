/**
 * Pure purchase decision logic. Kept free of I/O so it can be unit-tested exhaustively;
 * the transactional shell in shop.service.ts feeds it row-locked state.
 */
import type { ErrorCode } from '@ogfn/shared-types';

export interface PurchaseInput {
  now: Date;
  balance: number;
  expectedPrice: number;
  offer: { price: number; itemIds: string[]; rotationEndsAt: Date; rotationStartsAt: Date } | null;
  /** Cosmetic ids the recipient already owns (subset of offer items). */
  alreadyOwned: string[];
}

export type PurchaseDecision =
  | { ok: true; charge: number; grant: string[]; balanceAfter: number }
  | { ok: false; code: ErrorCode; status: number; message: string };

export function evaluatePurchase(input: PurchaseInput): PurchaseDecision {
  const { offer } = input;
  if (!offer) return { ok: false, code: 'NOT_FOUND', status: 404, message: 'Offer not found' };
  if (input.now < offer.rotationStartsAt || input.now >= offer.rotationEndsAt) {
    return { ok: false, code: 'OFFER_EXPIRED', status: 409, message: 'This offer is no longer in the shop' };
  }
  if (offer.price !== input.expectedPrice) {
    return { ok: false, code: 'PRICE_CHANGED', status: 409, message: `Price changed to ${offer.price} V-Bucks` };
  }
  const owned = new Set(input.alreadyOwned);
  const grant = offer.itemIds.filter((id) => !owned.has(id));
  if (grant.length === 0) return { ok: false, code: 'ALREADY_OWNED', status: 409, message: 'You already own this' };
  // Bundles with partially-owned contents still charge the bundle price (2018 behavior).
  const charge = offer.price;
  if (input.balance < charge) {
    return { ok: false, code: 'INSUFFICIENT_FUNDS', status: 402, message: `You need ${charge - input.balance} more V-Bucks` };
  }
  return { ok: true, charge, grant, balanceAfter: input.balance - charge };
}
