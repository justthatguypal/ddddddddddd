import { Prisma, PrismaClient } from '@prisma/client';

export type Db = PrismaClient;
export type Tx = Prisma.TransactionClient;

export function createPrisma(url?: string): PrismaClient {
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
  });
}

/**
 * Run `fn` in a SERIALIZABLE transaction, retrying on serialization failures / deadlocks.
 * Callers must keep `fn` free of side effects outside the transaction (emit events after).
 */
export async function serializable<T>(db: PrismaClient, fn: (tx: Tx) => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 10_000,
      });
    } catch (err) {
      lastErr = err;
      const code = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;
      const msg = err instanceof Error ? err.message : '';
      const retryable = code === 'P2034' || /could not serialize|deadlock detected|40001|40P01/.test(msg);
      if (!retryable) throw err;
      await new Promise((r) => setTimeout(r, 5 + Math.random() * 20 * (i + 1)));
    }
  }
  throw lastErr;
}

export const isUniqueViolation = (err: unknown, field?: string): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError &&
  err.code === 'P2002' &&
  (!field || JSON.stringify(err.meta?.target ?? '').includes(field));
