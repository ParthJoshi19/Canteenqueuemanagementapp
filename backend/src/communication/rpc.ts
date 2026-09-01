/**
 * Unit II - Communication: Remote Procedure Call (RPC) Framework
 * 
 * Demonstrates direct synchronous service-to-service communication.
 * E.g., Order Service issuing an RPC to Kitchen Service to inspect capacity & reserve menu stock.
 */

import { DSEngine } from '../ds/dsEngine.js';

export interface RPCRequest {
  rpcId: string;
  callerService: string;
  targetService: string;
  method: string;
  params: any;
  lamportClock: number;
}

export interface RPCResponse {
  rpcId: string;
  success: boolean;
  result?: any;
  error?: string;
  responderLamportClock: number;
  executionTimeMs: number;
}

type RPCHandler = (params: any, callerService: string) => Promise<any> | any;

class RPCRegistry {
  private handlers: Map<string, RPCHandler> = new Map();
  private logs: Array<{ request: RPCRequest; response: RPCResponse }> = [];

  constructor() {
    this.registerBuiltInHandlers();
  }

  public register(serviceName: string, method: string, handler: RPCHandler): void {
    const key = `${serviceName}:${method}`;
    this.handlers.set(key, handler);
  }

  public async call(callerService: string, targetService: string, method: string, params: any): Promise<RPCResponse> {
    const startTime = Date.now();
    const key = `${targetService}:${method}`;
    const handler = this.handlers.get(key);

    const { senderClock, receiverClock } = DSEngine.recordInterServiceEvent(
      callerService,
      targetService,
      `RPC:${method}`,
      params
    );

    const request: RPCRequest = {
      rpcId: `RPC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      callerService,
      targetService,
      method,
      params,
      lamportClock: senderClock
    };

    if (!handler) {
      const response: RPCResponse = {
        rpcId: request.rpcId,
        success: false,
        error: `RPC Method '${method}' not found on target service '${targetService}'.`,
        responderLamportClock: receiverClock,
        executionTimeMs: Date.now() - startTime
      };
      this.logs.unshift({ request, response });
      return response;
    }

    try {
      const result = await handler(params, callerService);
      const response: RPCResponse = {
        rpcId: request.rpcId,
        success: true,
        result,
        responderLamportClock: receiverClock,
        executionTimeMs: Date.now() - startTime
      };
      this.logs.unshift({ request, response });
      if (this.logs.length > 50) this.logs.pop();
      return response;
    } catch (err: any) {
      const response: RPCResponse = {
        rpcId: request.rpcId,
        success: false,
        error: err.message || 'RPC Execution Exception',
        responderLamportClock: receiverClock,
        executionTimeMs: Date.now() - startTime
      };
      this.logs.unshift({ request, response });
      return response;
    }
  }

  public getLogs() {
    return this.logs;
  }

  private registerBuiltInHandlers() {
    // Kitchen Service RPC Methods
    this.register("kitchen-service", "checkCapacity", (params) => {
      return {
        kitchenActive: true,
        availableChefs: 3,
        queueCapacityRemaining: 25,
        estimatedPrepTimeMinutes: 12
      };
    });

    this.register("kitchen-service", "reserveStock", (params) => {
      const { items } = params;
      return {
        reserved: true,
        itemCount: items ? items.length : 1,
        reservationToken: `RES-${Date.now()}`
      };
    });

    // Queue Service RPC Methods
    this.register("queue-service", "calculateWaitTime", (params) => {
      const { orderCount } = params;
      return {
        estimatedWaitMinutes: Math.max(3, (orderCount || 1) * 4),
        priorityTier: orderCount > 5 ? "EXPEDITED" : "STANDARD"
      };
    });
  }
}

export const rpcRegistry = new RPCRegistry();
