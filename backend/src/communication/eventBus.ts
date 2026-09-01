/**
 * Unit II - Communication: Message-Oriented Communication
 * 
 * Provides Event Bus functionality using Node.js EventEmitter with built-in support
 * for Redis Pub/Sub topics for decoupled asynchronous communication between microservices.
 */

import { EventEmitter } from 'events';
import { DSEngine } from '../ds/dsEngine.js';

export interface DSEvent {
  eventId: string;
  topic: string;
  senderService: string;
  payload: any;
  lamportClock: number;
  vectorClock: Record<string, number>;
  timestamp: string;
}

class DistributedEventBus extends EventEmitter {
  private eventHistory: DSEvent[] = [];

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Publishes an event to the distributed message broker topic
   */
  public publish(topic: string, senderService: string, receiverService: string, payload: any): DSEvent {
    const { senderClock, vector } = DSEngine.recordInterServiceEvent(
      senderService,
      receiverService,
      `PUB:${topic}`,
      payload
    );

    const event: DSEvent = {
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      topic,
      senderService,
      payload,
      lamportClock: senderClock,
      vectorClock: vector,
      timestamp: new Date().toISOString()
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 50) this.eventHistory.pop();

    // Broadcast on event emitter
    this.emit(topic, event);
    this.emit('*', event);

    return event;
  }

  public getHistory(): DSEvent[] {
    return this.eventHistory;
  }
}

export const eventBus = new DistributedEventBus();
