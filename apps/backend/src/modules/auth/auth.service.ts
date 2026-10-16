import { authenticator } from 'otplib';
import type { User } from '@prisma/client';
import type { LoginBody, RegisterBody, SessionInfo, TokenPair, UserMe } from '@ogfn/shared-types';
import { emptyLoadout, PRESET_COUNT } from '@ogfn/shared-types';
import { COSMETICS } from '@ogfn/game-data';
import { Errors } from '../../common/filters/errors.js';
import { isUniqueViolation } from '../../common/prisma/prisma.js';
import { RK } from '../../common/redis/redis.js';
import { randomToken, sha256 } from '../../common/util/crypto.js';
import type { AppContext } from '../../context.js';
import { burnVerify, hashPassword, verifyPassword } from './password.js';

export interface ClientMeta {
  ip?: string;
  deviceName?: string;
}

authenticator.options = { window: 1 };

export class AuthService {
  constructor(private readonly ctx: AppContext) {}

  async register(body: RegisterBody, meta: ClientMeta): Promise<{ tokens: TokenPair; user: UserMe }> {
    const { db, env } = this.ctx;
    if (!env.FEATURE_REGISTRATION) throw Errors.featureDisabled('Registration');
    const passwordHash = await hashPassword(body.password);
    const defaults = COSMETICS.filter((c) => c.isDefault);
    const loadout = Array.from({ length: PRESET_COUNT }, (_, i) => emptyLoadout(`Preset ${i + 1}`));
    const first = loadout[0]!;
    for (const c of defaults) {
      if (c.type === 'emote') first.slots.emote0 ??= c.id;
      else if (c.type in first.slots) (first.slots as Record<string, string | null>)[c.type] ??= c.id;
    }

    let user: User;
    try {
      user = await db.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: body.email,
            displayName: body.displayName,
            passwordHash,
            wallet: { create: { balance: env.STARTING_VBUCKS } },
            inventory: { create: defaults.map((c) => ({ cosmeticId: c.id, source: 'DEFAULT' as const })) },
            loadout: { create: { activePreset: 0, presets: loadout } },
          },
        });
        await tx.ledgerEntry.create({
          data: { userId: u.id, delta: env.STARTING_VBUCKS, balanceAfter: env.STARTING_VBUCKS, reason: 'GRANT', refId: 'signup' },
        });
        return u;
      });
    } catch (err) {
      if (isUniqueViolation(err, 'email')) throw Errors.conflict('EMAIL_TAKEN', 'An account with this email already exists');
      if (isUniqueViolation(err, 'displayName')) throw Errors.conflict('DISPLAY_NAME_TAKEN', 'That display name is taken');
      throw err;
    }
    const tokens = await this.createSession(user, meta);
    return { tokens, user: await this.ctx.users.getMe(user.id) };
  }

  async login(body: LoginBody, meta: ClientMeta): Promise<{ tokens: TokenPair; user: UserMe }> {
    const user = await this.ctx.db.user.findFirst({ where: { email: body.email, deletedAt: null } });
    const ok = user ? await verifyPassword(user.passwordHash, body.password) : await burnVerify(body.password);
    if (!user || !ok) throw Errors.unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
    if (user.totpEnabled) {
      if (!body.totp) throw Errors.unauthorized('Two-factor code required', 'TOTP_REQUIRED');
      if (!this.checkTotp(user.totpSecret, body.totp)) throw Errors.unauthorized('Invalid two-factor code', 'TOTP_INVALID');
    }
    const tokens = await this.createSession(user, { ...meta, deviceName: body.deviceName ?? meta.deviceName });
    return { tokens, user: await this.ctx.users.getMe(user.id) };
  }

  private checkTotp(sealed: string | null, code: string): boolean {
    if (!sealed) return false;
    return authenticator.check(code, this.ctx.secretBox.open(sealed));
  }

  private async createSession(user: Pick<User, 'id' | 'roles' | 'displayName'>, meta: ClientMeta): Promise<TokenPair> {
    const refreshToken = randomToken();
    const session = await this.ctx.db.session.create({
      data: {
        userId: user.id,
        ip: meta.ip ?? null,
        deviceName: meta.deviceName ?? null,
        expiresAt: new Date(Date.now() + this.ctx.env.REFRESH_TTL_DAYS * 86_400_000),
        tokens: { create: { hash: sha256(refreshToken) } },
      },
    });
    return this.issue(user, session.id, refreshToken);
  }

  private async issue(user: Pick<User, 'id' | 'roles' | 'displayName'>, sessionId: string, refreshToken: string): Promise<TokenPair> {
    const accessToken = await this.ctx.tokens.signAccess({ sub: user.id, sid: sessionId, roles: user.roles, name: user.displayName });
    return { accessToken, refreshToken, expiresIn: this.ctx.tokens.accessTtl, sessionId };
  }

  /**
   * Refresh-token rotation with reuse detection: each refresh token is single-use. Presenting
   * an already-used token means it leaked, so the whole session is revoked.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const { db } = this.ctx;
    const record = await db.refreshToken.findUnique({ where: { hash: sha256(refreshToken) }, include: { session: { include: { user: true } } } });
    if (!record) throw Errors.unauthorized('Invalid refresh token');
    const { session } = record;
    if (session.revokedAt || session.expiresAt < new Date() || session.user.deletedAt) {
      throw Errors.unauthorized('Session expired', 'TOKEN_EXPIRED');
    }
    const next = randomToken();
    const claimed = await db.refreshToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
    if (claimed.count === 0) {
      await this.revokeSession(session.id);
      throw Errors.unauthorized('Refresh token reuse detected; session revoked', 'TOKEN_REUSED');
    }
    await db.$transaction([
      db.refreshToken.create({ data: { sessionId: session.id, hash: sha256(next) } }),
      db.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }),
    ]);
    return this.issue(session.user, session.id, next);
  }

  async revokeSession(sessionId: string, userId?: string): Promise<void> {
    const res = await this.ctx.db.session.updateMany({
      where: { id: sessionId, revokedAt: null, ...(userId ? { userId } : {}) },
      data: { revokedAt: new Date() },
    });
    if (userId && res.count === 0) throw Errors.notFound('Session');
    await this.ctx.redis.set(RK.revokedSession(sessionId), '1', 'EX', this.ctx.tokens.accessTtl + 60);
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const sessions = await this.ctx.db.session.findMany({
      where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      select: { id: true },
    });
    for (const s of sessions) await this.revokeSession(s.id);
    return sessions.length;
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessions = await this.ctx.db.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      ip: s.ip,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt.toISOString(),
      current: s.id === currentSessionId,
    }));
  }

  async setupTotp(userId: string) {
    const user = await this.ctx.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.totpEnabled) throw Errors.conflict('CONFLICT', 'Two-factor authentication is already enabled');
    const secret = authenticator.generateSecret();
    await this.ctx.db.user.update({ where: { id: userId }, data: { totpPendingSecret: this.ctx.secretBox.seal(secret) } });
    return { secret, otpauthUrl: authenticator.keyuri(user.email, 'OGFN', secret) };
  }

  async verifyTotp(userId: string, code: string) {
    const user = await this.ctx.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!this.checkTotp(user.totpPendingSecret, code)) throw Errors.unauthorized('Invalid two-factor code', 'TOTP_INVALID');
    await this.ctx.db.user.update({
      where: { id: userId },
      data: { totpEnabled: true, totpSecret: user.totpPendingSecret, totpPendingSecret: null },
    });
  }

  async disableTotp(userId: string, code: string, password: string) {
    const user = await this.ctx.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await verifyPassword(user.passwordHash, password))) throw Errors.unauthorized('Incorrect password', 'INVALID_CREDENTIALS');
    if (!this.checkTotp(user.totpSecret, code)) throw Errors.unauthorized('Invalid two-factor code', 'TOTP_INVALID');
    await this.ctx.db.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecret: null } });
  }

  /** One-time code passed to the game client on launch (`{exchangeCode}` launch-arg placeholder). */
  async createExchangeCode(userId: string): Promise<{ code: string; expiresInSec: number }> {
    const code = randomToken(24);
    await this.ctx.redis.set(RK.exchangeCode(code), userId, 'EX', 300);
    return { code, expiresInSec: 300 };
  }

  async redeemExchangeCode(code: string): Promise<{ userId: string; displayName: string }> {
    const userId = await this.ctx.redis.getdel(RK.exchangeCode(code));
    if (!userId) throw Errors.unauthorized('Invalid or expired exchange code');
    const user = await this.ctx.db.user.findUniqueOrThrow({ where: { id: userId } });
    return { userId, displayName: user.displayName };
  }
}
