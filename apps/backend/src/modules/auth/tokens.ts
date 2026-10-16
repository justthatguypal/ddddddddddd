import { SignJWT, errors as joseErrors, jwtVerify } from 'jose';
import { AccessClaims } from '@ogfn/shared-types';
import { Errors } from '../../common/filters/errors.js';

const ISSUER = 'ogfn-backend';
const ACCESS_AUD = 'ogfn-launcher';
const TICKET_AUD = 'ogfn-game-server';

export interface JoinTicketClaims {
  sub: string;
  serverId: string;
  matchId: string | null;
  name: string;
}

export class TokenService {
  private readonly accessKey: Uint8Array;
  private readonly ticketKey: Uint8Array;

  constructor(
    accessSecret: string,
    ticketSecret: string,
    private readonly accessTtlSec: number,
  ) {
    this.accessKey = new TextEncoder().encode(accessSecret);
    this.ticketKey = new TextEncoder().encode(ticketSecret);
  }

  get accessTtl() {
    return this.accessTtlSec;
  }

  async signAccess(claims: AccessClaims): Promise<string> {
    return new SignJWT({ sid: claims.sid, roles: claims.roles, name: claims.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuer(ISSUER)
      .setAudience(ACCESS_AUD)
      .setIssuedAt()
      .setExpirationTime(`${this.accessTtlSec}s`)
      .sign(this.accessKey);
  }

  async verifyAccess(token: string): Promise<AccessClaims> {
    try {
      const { payload } = await jwtVerify(token, this.accessKey, { issuer: ISSUER, audience: ACCESS_AUD });
      return AccessClaims.parse({ sub: payload.sub, sid: payload.sid, roles: payload.roles, name: payload.name });
    } catch (err) {
      if (err instanceof joseErrors.JWTExpired) throw Errors.unauthorized('Access token expired', 'TOKEN_EXPIRED');
      throw Errors.unauthorized('Invalid access token');
    }
  }

  async signJoinTicket(claims: JoinTicketClaims, ttlSec = 120): Promise<{ ticket: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    const ticket = await new SignJWT({ serverId: claims.serverId, matchId: claims.matchId, name: claims.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuer(ISSUER)
      .setAudience(TICKET_AUD)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.ticketKey);
    return { ticket, expiresAt };
  }

  async verifyJoinTicket(ticket: string): Promise<JoinTicketClaims> {
    try {
      const { payload } = await jwtVerify(ticket, this.ticketKey, { issuer: ISSUER, audience: TICKET_AUD });
      return {
        sub: String(payload.sub),
        serverId: String(payload.serverId),
        matchId: (payload.matchId as string | null) ?? null,
        name: String(payload.name),
      };
    } catch {
      throw Errors.unauthorized('Invalid or expired join ticket');
    }
  }
}
