import type { ErrorCode } from '@ogfn/shared-types';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
    public readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  badRequest: (message: string, details?: unknown) => new AppError('BAD_REQUEST', 400, message, details),
  unauthorized: (message = 'Authentication required', code: ErrorCode = 'UNAUTHORIZED') =>
    new AppError(code, 401, message),
  forbidden: (message = 'You do not have access to this resource', code: ErrorCode = 'FORBIDDEN') =>
    new AppError(code, 403, message),
  notFound: (what: string) => new AppError('NOT_FOUND', 404, `${what} not found`),
  conflict: (code: ErrorCode, message: string, details?: unknown) => new AppError(code, 409, message, details),
  unprocessable: (code: ErrorCode, message: string, details?: unknown) => new AppError(code, 422, message, details),
  rateLimited: (retryAfterSec: number) =>
    new AppError('RATE_LIMITED', 429, `Too many requests. Try again in ${retryAfterSec}s.`, undefined, retryAfterSec),
  unavailable: (code: ErrorCode, message: string) => new AppError(code, 503, message),
  featureDisabled: (feature: string) => new AppError('FEATURE_DISABLED', 403, `${feature} is disabled on this server`),
};
