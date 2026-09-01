/**
 * Unit III - Synchronization: Vector Clocks
 * 
 * Tracks causal dependencies and detects concurrency conflicts between services.
 * Vector structure: [OrderService, QueueService, KitchenService]
 */

export type VectorState = Record<string, number>;

export interface VectorClockLog {
  serviceId: string;
  vector: VectorState;
  event: string;
  timestamp: string;
  causalRelation?: 'happened-before' | 'concurrent' | 'identical';
}

export class VectorClock {
  private serviceId: string;
  private vector: VectorState;
  private logs: VectorClockLog[] = [];

  constructor(serviceId: string, knownServices: string[] = ["order-service", "queue-service", "kitchen-service"]) {
    this.serviceId = serviceId;
    this.vector = {};
    knownServices.forEach(s => {
      this.vector[s] = 0;
    });
  }

  /**
   * Ticks local component of the vector clock
   */
  public increment(event: string): VectorState {
    if (this.vector[this.serviceId] === undefined) {
      this.vector[this.serviceId] = 0;
    }
    this.vector[this.serviceId] += 1;
    this.log(event);
    return { ...this.vector };
  }

  /**
   * Updates vector clock on receiving a message with remote vector V_msg:
   * V_local[i] = max(V_local[i], V_msg[i]) for all i
   * V_local[self] = V_local[self] + 1
   */
  public updateOnReceive(remoteVector: VectorState, event: string): { vector: VectorState; relation: string } {
    const relation = VectorClock.compare(this.vector, remoteVector);
    
    // Merge vectors: take component-wise maximum
    Object.keys(remoteVector).forEach(key => {
      this.vector[key] = Math.max(this.vector[key] || 0, remoteVector[key] || 0);
    });
    
    // Increment local component
    this.vector[this.serviceId] = (this.vector[this.serviceId] || 0) + 1;
    
    this.log(`MERGE (${event}) [Prev relation: ${relation}]`, relation);
    return { vector: { ...this.vector }, relation };
  }

  private log(event: string, causalRelation?: 'happened-before' | 'concurrent' | 'identical'): void {
    this.logs.unshift({
      serviceId: this.serviceId,
      vector: { ...this.vector },
      event,
      timestamp: new Date().toISOString(),
      causalRelation
    });
    if (this.logs.length > 50) this.logs.pop();
  }

  public getVector(): VectorState {
    return { ...this.vector };
  }

  public getLogs(): VectorClockLog[] {
    return this.logs;
  }

  /**
   * Compares two vector clock states V1 and V2:
   * - 'happened-before': V1 <= V2 and V1 != V2
   * - 'concurrent': neither V1 <= V2 nor V2 <= V1
   * - 'identical': V1 == V2
   */
  public static compare(v1: VectorState, v2: VectorState): 'happened-before' | 'concurrent' | 'identical' {
    const keys = Array.from(new Set([...Object.keys(v1), ...Object.keys(v2)]));
    let v1LessOrEqual = true;
    let v2LessOrEqual = true;
    let equal = true;

    for (const k of keys) {
      const val1 = v1[k] || 0;
      const val2 = v2[k] || 0;

      if (val1 > val2) v1LessOrEqual = false;
      if (val2 > val1) v2LessOrEqual = false;
      if (val1 !== val2) equal = false;
    }

    if (equal) return 'identical';
    if (v1LessOrEqual) return 'happened-before';
    if (v2LessOrEqual) return 'concurrent'; // or happened-after from perspective of v2
    return 'concurrent';
  }
}

// Global registry of service vector clocks
export const serviceVectorClocks: Record<string, VectorClock> = {
  "order-service": new VectorClock("order-service"),
  "queue-service": new VectorClock("queue-service"),
  "kitchen-service": new VectorClock("kitchen-service")
};
