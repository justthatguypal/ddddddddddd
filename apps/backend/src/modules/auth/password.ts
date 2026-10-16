import { Algorithm, hash, verify } from '@node-rs/argon2';

/** OWASP 2024 baseline for Argon2id: m=19 MiB, t=2, p=1. */
const OPTIONS = { algorithm: Algorithm.Argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, OPTIONS);

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/** Used when the account doesn't exist so login timing doesn't leak which emails are registered. */
let dummyHash: Promise<string> | null = null;
export async function burnVerify(password: string): Promise<false> {
  dummyHash ??= hashPassword('ogfn-timing-equalizer');
  await verifyPassword(await dummyHash, password);
  return false;
}
