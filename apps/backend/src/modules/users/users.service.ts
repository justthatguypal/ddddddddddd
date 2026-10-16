import type { Friend, PatchMeBody, PublicProfile, UserMe } from '@ogfn/shared-types';
import { Errors } from '../../common/filters/errors.js';
import { isUniqueViolation } from '../../common/prisma/prisma.js';
import type { AppContext } from '../../context.js';
import { hashPassword, verifyPassword } from '../auth/password.js';

export class UsersService {
  constructor(private readonly ctx: AppContext) {}

  async getMe(userId: string): Promise<UserMe> {
    const u = await this.ctx.db.user.findFirst({ where: { id: userId, deletedAt: null }, include: { wallet: true } });
    if (!u) throw Errors.notFound('User');
    const cooldownMs = this.ctx.env.DISPLAY_NAME_COOLDOWN_DAYS * 86_400_000;
    const availableAt = u.displayNameChangedAt ? new Date(u.displayNameChangedAt.getTime() + cooldownMs) : null;
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      avatarId: u.avatarId,
      bannerId: u.bannerId,
      roles: u.roles,
      twoFactorEnabled: u.totpEnabled,
      vbucks: u.wallet?.balance ?? 0,
      createdAt: u.createdAt.toISOString(),
      displayNameChangedAt: u.displayNameChangedAt?.toISOString() ?? null,
      displayNameAvailableAt: availableAt && availableAt > new Date() ? availableAt.toISOString() : null,
    };
  }

  async patchMe(userId: string, body: PatchMeBody): Promise<UserMe> {
    const me = await this.getMe(userId);
    const data: { avatarId?: string; bannerId?: string; displayName?: string; displayNameChangedAt?: Date } = {};
    if (body.avatarId) data.avatarId = body.avatarId;
    if (body.bannerId) data.bannerId = body.bannerId;
    if (body.displayName && body.displayName !== me.displayName) {
      if (me.displayNameAvailableAt) {
        throw Errors.conflict('DISPLAY_NAME_COOLDOWN', 'You changed your display name recently', {
          availableAt: me.displayNameAvailableAt,
        });
      }
      data.displayName = body.displayName;
      data.displayNameChangedAt = new Date();
    }
    try {
      await this.ctx.db.user.update({ where: { id: userId }, data });
    } catch (err) {
      if (isUniqueViolation(err, 'displayName')) throw Errors.conflict('DISPLAY_NAME_TAKEN', 'That display name is taken');
      throw err;
    }
    return this.getMe(userId);
  }

  async changePassword(userId: string, sessionId: string, current: string, next: string) {
    const u = await this.ctx.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await verifyPassword(u.passwordHash, current))) throw Errors.unauthorized('Incorrect password', 'INVALID_CREDENTIALS');
    await this.ctx.db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
    await this.ctx.auth.revokeAllSessions(userId, sessionId);
  }

  /** Soft delete: PII is scrubbed, inventory and match history are cascaded on hard purge. */
  async deleteAccount(userId: string, confirmDisplayName: string, password: string) {
    const u = await this.ctx.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (confirmDisplayName !== u.displayName) throw Errors.badRequest('Display name confirmation does not match');
    if (!(await verifyPassword(u.passwordHash, password))) throw Errors.unauthorized('Incorrect password', 'INVALID_CREDENTIALS');
    await this.ctx.auth.revokeAllSessions(userId);
    await this.ctx.db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted+${userId}@ogfn.invalid`,
        displayName: `deleted_${userId.slice(-8)}`,
        totpSecret: null,
        totpEnabled: false,
      },
    });
  }

  async getProfile(userId: string): Promise<PublicProfile> {
    const u = await this.ctx.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!u) throw Errors.notFound('User');
    const agg = await this.ctx.db.playerMatch.aggregate({ where: { userId }, _count: true, _sum: { kills: true } });
    const wins = await this.ctx.db.playerMatch.count({ where: { userId, placement: 1 } });
    return {
      id: u.id,
      displayName: u.displayName,
      avatarId: u.avatarId,
      bannerId: u.bannerId,
      createdAt: u.createdAt.toISOString(),
      stats: { matches: agg._count, wins, kills: agg._sum.kills ?? 0 },
    };
  }

  async friendIds(userId: string): Promise<string[]> {
    const rows = await this.ctx.db.friendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
  }

  async friends(userId: string): Promise<Friend[]> {
    const ids = await this.friendIds(userId);
    const users = await this.ctx.db.user.findMany({ where: { id: { in: ids }, deletedAt: null } });
    const presence = await Promise.all(users.map((u) => this.ctx.presence.get(u.id)));
    return users
      .map((u, i) => ({
        id: u.id,
        displayName: u.displayName,
        avatarId: u.avatarId,
        status: presence[i]!.status,
        activity: presence[i]!.activity,
        partyId: presence[i]!.partyId,
      }))
      .sort((a, b) => (a.status === 'offline' ? 1 : 0) - (b.status === 'offline' ? 1 : 0) || a.displayName.localeCompare(b.displayName));
  }

  async addFriend(userId: string, displayName: string) {
    const target = await this.ctx.db.user.findFirst({ where: { displayName, deletedAt: null } });
    if (!target || target.id === userId) throw Errors.notFound('Player');
    const reverse = await this.ctx.db.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId: target.id, addresseeId: userId } },
    });
    if (reverse) {
      await this.ctx.db.friendship.update({ where: { id: reverse.id }, data: { status: 'ACCEPTED' } });
      return { status: 'ACCEPTED' as const };
    }
    await this.ctx.db.friendship.upsert({
      where: { requesterId_addresseeId: { requesterId: userId, addresseeId: target.id } },
      update: {},
      create: { requesterId: userId, addresseeId: target.id },
    });
    return { status: 'PENDING' as const };
  }
}
