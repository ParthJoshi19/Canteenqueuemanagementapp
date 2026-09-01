/**
 * Unit III - Synchronization: Distributed Mutual Exclusion (Ricart-Agrawala Algorithm)
 * 
 * Guarantees exclusive critical section access for processing canteen orders.
 * Prevents multiple kitchen workers/services from claiming or double-preparing the same order.
 */

export interface LockRequest {
  requestId: string;
  workerId: string;
  orderId: number;
  lamportTimestamp: number;
  timestamp: string;
  status: 'REQUESTING' | 'HELD' | 'RELEASED';
}

export interface MutexLog {
  timestamp: string;
  workerId: string;
  orderId: number;
  event: 'REQUEST_LOCK' | 'GRANT_LOCK' | 'RELEASE_LOCK' | 'LOCK_REJECTED';
  details: string;
}

export class DistributedMutualExclusion {
  private activeLocks: Map<number, { workerId: string; timestamp: number }> = new Map();
  private requestQueue: LockRequest[] = [];
  private logs: MutexLog[] = [];

  /**
   * Requests Critical Section Access for an Order ID using Ricart-Agrawala logical timestamping
   */
  public requestLock(workerId: string, orderId: number, lamportTimestamp: number): { granted: boolean; message: string } {
    const existingLock = this.activeLocks.get(orderId);

    if (!existingLock) {
      // Grant immediately
      this.activeLocks.set(orderId, { workerId, timestamp: lamportTimestamp });
      this.addLog('GRANT_LOCK', workerId, orderId, `Lock GRANTED for order #${orderId} to ${workerId} (Lamport t=${lamportTimestamp}). Critical section entered.`);
      return { granted: true, message: `Lock acquired for Order #${orderId}` };
    }

    if (existingLock.workerId === workerId) {
      return { granted: true, message: `Worker ${workerId} already holds lock for Order #${orderId}` };
    }

    // Conflict: Another worker holds lock. Queue request ordered by (Lamport timestamp, Worker ID)
    const request: LockRequest = {
      requestId: `${workerId}-${orderId}-${Date.now()}`,
      workerId,
      orderId,
      lamportTimestamp,
      timestamp: new Date().toISOString(),
      status: 'REQUESTING'
    };

    this.requestQueue.push(request);
    // Sort queue by Ricart-Agrawala timestamp priority
    this.requestQueue.sort((a, b) => a.lamportTimestamp - b.lamportTimestamp || a.workerId.localeCompare(b.workerId));

    this.addLog('LOCK_REJECTED', workerId, orderId, `Lock DENIED for order #${orderId}. Currently held by ${existingLock.workerId}. Request queued with Ricart-Agrawala priority t=${lamportTimestamp}.`);
    return { granted: false, message: `Order #${orderId} locked by ${existingLock.workerId}. Queued for execution.` };
  }

  /**
   * Releases Critical Section Access and grants lock to next queued worker in Ricart-Agrawala priority order
   */
  public releaseLock(workerId: string, orderId: number): { released: boolean; nextGrantedWorker?: string } {
    const existingLock = this.activeLocks.get(orderId);

    if (!existingLock || existingLock.workerId !== workerId) {
      return { released: false };
    }

    this.activeLocks.delete(orderId);
    this.addLog('RELEASE_LOCK', workerId, orderId, `Worker ${workerId} RELEASED critical section lock for Order #${orderId}.`);

    // Check if there are queued requests for this order
    const nextReqIndex = this.requestQueue.findIndex(r => r.orderId === orderId);
    if (nextReqIndex !== -1) {
      const [nextReq] = this.requestQueue.splice(nextReqIndex, 1);
      nextReq.status = 'HELD';
      this.activeLocks.set(orderId, { workerId: nextReq.workerId, timestamp: nextReq.lamportTimestamp });
      this.addLog('GRANT_LOCK', nextReq.workerId, orderId, `Lock DELEGATED to next queued worker ${nextReq.workerId} for Order #${orderId}.`);
      return { released: true, nextGrantedWorker: nextReq.workerId };
    }

    return { released: true };
  }

  public getActiveLocks(): Array<{ orderId: number; workerId: string; timestamp: number }> {
    return Array.from(this.activeLocks.entries()).map(([orderId, val]) => ({
      orderId,
      workerId: val.workerId,
      timestamp: val.timestamp
    }));
  }

  public getRequestQueue(): LockRequest[] {
    return this.requestQueue;
  }

  public getLogs(): MutexLog[] {
    return this.logs;
  }

  private addLog(event: MutexLog['event'], workerId: string, orderId: number, details: string): void {
    this.logs.unshift({
      timestamp: new Date().toISOString(),
      workerId,
      orderId,
      event,
      details
    });
    if (this.logs.length > 50) this.logs.pop();
  }
}

export const distributedMutexInstance = new DistributedMutualExclusion();
