/**
 * EventBus: the only way services push realtime events. Decouples domain code from Socket.IO
 * (tests attach a listener instead of a socket server; a Redis adapter can be added for multi-node).
 */
import type { Server } from 'socket.io';
import type { ServerToClientEvent, ServerToClientPayload } from '@ogfn/shared-types';

export type BusTarget = { kind: 'user'; id: string } | { kind: 'room'; id: string } | { kind: 'all' };
export type BusListener = (target: BusTarget, event: ServerToClientEvent, payload: unknown) => void;

export const userRoom = (userId: string) => `user:${userId}`;
export const SERVERS_ROOM = 'servers';

export class EventBus {
  private io: Server | null = null;
  private listeners = new Set<BusListener>();

  attach(io: Server) {
    this.io = io;
  }

  listen(fn: BusListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private dispatch(target: BusTarget, event: ServerToClientEvent, payload: unknown) {
    for (const l of this.listeners) l(target, event, payload);
    if (!this.io) return;
    if (target.kind === 'all') this.io.emit(event, payload);
    else this.io.to(target.kind === 'user' ? userRoom(target.id) : target.id).emit(event, payload);
  }

  toUser<E extends ServerToClientEvent>(userId: string, event: E, payload: ServerToClientPayload<E>) {
    this.dispatch({ kind: 'user', id: userId }, event, payload);
  }

  toUsers<E extends ServerToClientEvent>(userIds: Iterable<string>, event: E, payload: ServerToClientPayload<E>) {
    for (const id of userIds) this.toUser(id, event, payload);
  }

  toRoom<E extends ServerToClientEvent>(room: string, event: E, payload: ServerToClientPayload<E>) {
    this.dispatch({ kind: 'room', id: room }, event, payload);
  }

  broadcast<E extends ServerToClientEvent>(event: E, payload: ServerToClientPayload<E>) {
    this.dispatch({ kind: 'all' }, event, payload);
  }
}
