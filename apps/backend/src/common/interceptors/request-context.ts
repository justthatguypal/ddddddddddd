import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '@ogfn/shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

export function genReqId(req: { headers: Record<string, string | string[] | undefined> }): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  return typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
}

/**
 * Request/correlation IDs: `x-request-id` identifies one hop, `x-correlation-id` follows a
 * user action across launcher → backend → orchestrator. Both are echoed and logged.
 */
export function registerRequestContext(app: FastifyInstance) {
  app.decorateRequest('correlationId', '');
  app.addHook('onRequest', async (req, reply) => {
    const incoming = req.headers[CORRELATION_ID_HEADER];
    req.correlationId = typeof incoming === 'string' && incoming.length <= 64 ? incoming : req.id;
    req.log = req.log.child({ correlationId: req.correlationId });
    reply.header(REQUEST_ID_HEADER, req.id);
    reply.header(CORRELATION_ID_HEADER, req.correlationId);
  });
}
