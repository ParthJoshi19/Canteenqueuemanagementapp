/**
 * Unit III - Synchronization: Lamport Logical Clocks
 * 
 * Provides logical timestamps to enforce total ordering of events across
 * distributed services (Order Service, Queue Service, Kitchen Service).
 * 
 * Rules:
 * 1. Before an event, tick local clock: L = L + 1
 * 2. On sending message, attach current L
 * 3. On receiving message with L_msg: L_local = max(L_local, L_msg) + 1
 */

export interface LamportEvent {
  serviceId: string;
  clock: number;
  eventType: string;
  details: any;
  timestamp: string;
}

export class LamportClock {
  private clock: number = 0;
  private serviceId: string;
  private history: LamportEvent[] = [];

  constructor(serviceId: string, initialClock: number = 0) {
    this.serviceId = serviceId;
    this.clock = initialClock;
  }

  /**
   * Ticks local clock for an internal event or before sending a message
   */
  public tick(eventType: string, details: any = {}): number {
    this.clock += 1;
    const event: LamportEvent = {
      serviceId: this.serviceId,
      clock: this.clock,
      eventType,
      details,
      timestamp: new Date().toISOString()
    };
    this.history.unshift(event);
    if (this.history.length > 50) this.history.pop();
    return this.clock;
  }

  /**
   * Updates local clock upon receiving a message containing sender's Lamport clock
   */
  public updateOnReceive(remoteClock: number, eventType: string, details: any = {}): number {
    this.clock = Math.max(this.clock, remoteClock) + 1;
    const event: LamportEvent = {
      serviceId: this.serviceId,
      clock: this.clock,
      eventType: `RECEIVE:${eventType} (Remote L=${remoteClock})`,
      details,
      timestamp: new Date().toISOString()
    };
    this.history.unshift(event);
    if (this.history.length > 50) this.history.pop();
    return this.clock;
  }

  public getClock(): number {
    return this.clock;
  }

  public getHistory(): LamportEvent[] {
    return this.history;
  }
}

// Global registry of service clocks for demo & simulation
export const serviceLamportClocks: Record<string, LamportClock> = {
  "order-service": new LamportClock("order-service"),
  "queue-service": new LamportClock("queue-service"),
  "kitchen-service": new LamportClock("kitchen-service"),
  "notification-service": new LamportClock("notification-service")
};
