import { Redis } from 'ioredis';

export type RedisClient = Redis;

export function createRedis(url: string, prefix = ''): Redis {
  return new Redis(url, {
    keyPrefix: prefix || undefined,
    maxRetriesPerRequest: 3,
    enableAutoPipelining: true,
    lazyConnect: false,
  });
}

/** Central registry of Redis key shapes so modules never hand-format keys. */
export const RK = {
  rateLimit: (scope: string, id: string) => `rl:${scope}:${id}`,
  idempotency: (scope: string, key: string) => `idem:${scope}:${key}`,
  revokedSession: (sid: string) => `auth:revoked:${sid}`,
  exchangeCode: (code: string) => `auth:exchange:${code}`,
  serverLive: (id: string) => `srv:live:${id}`,
  serverReserved: (id: string) => `srv:reserved:${id}`,
  serverIndex: 'srv:index',
  mmQueue: (mode: string, region: string, bots: boolean) => `mm:q:${mode}:${region}:${bots ? 'bots' : 'nobots'}`,
  mmTicket: (userId: string) => `mm:ticket:${userId}`,
  mmLock: 'mm:lock',
  mmActive: (userId: string) => `mm:active:${userId}`,
  presence: (userId: string) => `presence:${userId}`,
  presenceConns: (userId: string) => `presence:conns:${userId}`,
  party: (id: string) => `party:${id}`,
  partyOf: (userId: string) => `party:of:${userId}`,
  shopLastRotation: 'shop:last-rotation',
};
