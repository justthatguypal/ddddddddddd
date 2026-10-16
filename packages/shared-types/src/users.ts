import { z } from 'zod';
import { DisplayName, Password, TokenPair } from './auth.js';
import { IsoDate } from './common.js';

export const Role = z.enum(['PLAYER', 'ADMIN']);
export type Role = z.infer<typeof Role>;

export const AVATAR_IDS = ['default', 'rust', 'agent', 'moon', 'voyager', 'reaper', 'llama'] as const;
export const BANNER_IDS = ['default', 'meteor', 'rocket', 'stars', 'crown', 'llama'] as const;

export const UserMe = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  avatarId: z.string(),
  bannerId: z.string(),
  roles: z.array(Role),
  twoFactorEnabled: z.boolean(),
  vbucks: z.number().int(),
  createdAt: IsoDate,
  displayNameChangedAt: IsoDate.nullable(),
  /** When the display name can next be changed (null = now). */
  displayNameAvailableAt: IsoDate.nullable(),
});
export type UserMe = z.infer<typeof UserMe>;

export const AuthResponse = z.object({ tokens: TokenPair, user: UserMe });
export type AuthResponse = z.infer<typeof AuthResponse>;

export const PatchMeBody = z
  .object({
    displayName: DisplayName.optional(),
    avatarId: z.enum(AVATAR_IDS).optional(),
    bannerId: z.enum(BANNER_IDS).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export type PatchMeBody = z.infer<typeof PatchMeBody>;

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: Password,
});

export const DeleteAccountBody = z.object({
  confirmDisplayName: z.string(),
  password: z.string().min(1),
});

export const PublicProfile = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarId: z.string(),
  bannerId: z.string(),
  createdAt: IsoDate,
  stats: z.object({ matches: z.number().int(), wins: z.number().int(), kills: z.number().int() }),
});
export type PublicProfile = z.infer<typeof PublicProfile>;

export const PRESENCE_STATUSES = ['online', 'away', 'in-match', 'in-queue', 'offline'] as const;
export const PresenceStatus = z.enum(PRESENCE_STATUSES);
export type PresenceStatus = z.infer<typeof PresenceStatus>;

export const Friend = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarId: z.string(),
  status: PresenceStatus,
  activity: z.string().nullable(),
  partyId: z.string().nullable(),
});
export type Friend = z.infer<typeof Friend>;

export const Party = z.object({
  id: z.string(),
  leaderId: z.string(),
  members: z.array(z.object({ id: z.string(), displayName: z.string(), avatarId: z.string() })),
  maxSize: z.number().int(),
});
export type Party = z.infer<typeof Party>;
