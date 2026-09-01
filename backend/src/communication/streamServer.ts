/**
 * Unit II - Communication: Stream-Oriented Communication (SSE Server)
 * 
 * Provides real-time Server-Sent Events (SSE) streaming of distributed system state,
 * queue positions, and algorithm execution trace logs to connected frontend clients.
 */

import { Response } from 'express';
import { DSEngine } from '../ds/dsEngine.js';
import { eventBus } from './eventBus.js';

class StreamServer {
  private clients: Set<Response> = new Set();

  constructor() {
    // Whenever an event occurs on eventBus, push real-time stream update to all clients
    eventBus.on('*', (event) => {
      this.broadcast({
        type: 'EVENT_BUS_PUBLISH',
        event,
        snapshot: DSEngine.getSnapshot()
      });
    });
  }

  public addClient(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.add(res);

    // Send initial snapshot immediately
    const initialData = JSON.stringify({
      type: 'INIT_SNAPSHOT',
      snapshot: DSEngine.getSnapshot()
    });
    res.write(`data: ${initialData}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public broadcast(data: any) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => {
      client.write(payload);
    });
  }
}

export const streamServer = new StreamServer();
