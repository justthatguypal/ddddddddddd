import type { FastifyError, FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';
import type { ApiErrorBody } from '@ogfn/shared-types';
import { AppError } from './errors.js';

/** Maps every thrown error to the `{ error: { code, message, ... } }` envelope. */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err: FastifyError | AppError | Error, req, reply) => {
    const requestId = req.id;
    const send = (status: number, body: ApiErrorBody) => {
      if (body.error.retryAfterSec) reply.header('retry-after', String(body.error.retryAfterSec));
      return reply.status(status).send(body);
    };

    if (err instanceof AppError) {
      if (err.statusCode >= 500) req.log.error({ err }, err.message);
      return send(err.statusCode, {
        error: { code: err.code, message: err.message, details: err.details, requestId, retryAfterSec: err.retryAfterSec },
      });
    }

    if (hasZodFastifySchemaValidationErrors(err)) {
      return send(400, {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: err.validation.map((v) => ({
            path: v.instancePath || v.params.issue.path.join('.'),
            message: v.params.issue.message ?? v.message,
          })),
          requestId,
        },
      });
    }

    if (isResponseSerializationError(err)) {
      // A response failed its own schema: that is a server bug and must fail loudly.
      req.log.error({ err, issues: err.cause.issues, url: req.url }, 'Response serialization failed');
      return send(500, { error: { code: 'INTERNAL', message: 'Response failed validation', requestId } });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return send(409, { error: { code: 'CONFLICT', message: 'Resource already exists', details: err.meta, requestId } });
      }
      if (err.code === 'P2025') {
        return send(404, { error: { code: 'NOT_FOUND', message: 'Resource not found', requestId } });
      }
    }

    const fErr = err as FastifyError;
    if (fErr.statusCode && fErr.statusCode < 500) {
      return send(fErr.statusCode, {
        error: { code: fErr.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: fErr.message, requestId },
      });
    }

    req.log.error({ err }, 'Unhandled error');
    return send(500, { error: { code: 'INTERNAL', message: 'Internal server error', requestId } });
  });

  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found`, requestId: req.id } }),
  );
}
