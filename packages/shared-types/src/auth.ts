import { z } from 'zod';
import { IsoDate } from './common.js';

export const Email = z.string().trim().toLowerCase().email().max(254);
export const Password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');
export const DisplayName = z
  .string()
  .trim()
  .min(3, 'Display name must be at least 3 characters')
  .max(16, 'Display name must be at most 16 characters')
  .regex(/^[A-Za-z0-9_.-]+$/, 'Letters, numbers, underscores, dots and dashes only');
export const TotpCode = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');

export const RegisterBody = z.object({
  email: Email,
  password: Password,
  displayName: DisplayName,
});
export type RegisterBody = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({
  email: Email,
  password: z.string().min(1, 'Password is required').max(128),
  totp: TotpCode.optional(),
  deviceName: z.string().max(64).optional(),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Seconds until the access token expires. */
  expiresIn: z.number().int(),
  sessionId: z.string(),
});
export type TokenPair = z.infer<typeof TokenPair>;

export const RefreshBody = z.object({ refreshToken: z.string().min(20) });
export type RefreshBody = z.infer<typeof RefreshBody>;

export const LogoutBody = z.object({ refreshToken: z.string().min(20).optional() });

export const TotpSetupResponse = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
});
export type TotpSetupResponse = z.infer<typeof TotpSetupResponse>;

export const TotpVerifyBody = z.object({ code: TotpCode });
export const TotpDisableBody = z.object({ code: TotpCode, password: z.string().min(1) });

export const SessionInfo = z.object({
  id: z.string(),
  deviceName: z.string().nullable(),
  ip: z.string().nullable(),
  createdAt: IsoDate,
  lastUsedAt: IsoDate,
  current: z.boolean(),
});
export type SessionInfo = z.infer<typeof SessionInfo>;

/** Decoded access-token claims (HS256, issued by the backend). */
export const AccessClaims = z.object({
  sub: z.string(),
  sid: z.string(),
  roles: z.array(z.enum(['PLAYER', 'ADMIN'])),
  name: z.string(),
});
export type AccessClaims = z.infer<typeof AccessClaims>;
