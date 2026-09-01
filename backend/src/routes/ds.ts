/**
 * Distributed Systems API Routes (Units I - IV)
 * 
 * Exposes inspection and interactive triggers for:
 * 1. SSE Stream: GET /api/ds/stream
 * 2. Full Snapshot: GET /api/ds/snapshot
 * 3. Lamport Clock Tick: POST /api/ds/lamport/tick
 * 4. Vector Clock Compare/Event: POST /api/ds/vector/event
 * 5. Leader Election Trigger/Crash: POST /api/ds/leader/election, POST /api/ds/leader/node-status
 * 6. Mutual Exclusion Lock/Release: POST /api/ds/mutex/request, POST /api/ds/mutex/release
 * 7. Inter-Service RPC Trigger: POST /api/ds/rpc/call
 * 8. Message Broker Event Bus History: GET /api/ds/eventbus/history
 */

import { Router, Request, Response } from 'express';
import { DSEngine } from '../ds/dsEngine.js';
import { serviceLamportClocks } from '../ds/lamportClock.js';
import { serviceVectorClocks } from '../ds/vectorClock.js';
import { bullyElectionInstance } from '../ds/leaderElection.js';
import { distributedMutexInstance } from '../ds/mutualExclusion.js';
import { rpcRegistry } from '../communication/rpc.js';
import { eventBus } from '../communication/eventBus.js';
import { streamServer } from '../communication/streamServer.js';

const router = Router();

// GET /api/ds/stream - SSE real-time stream endpoint
router.get('/stream', (req: Request, res: Response) => {
  streamServer.addClient(res);
});

// GET /api/ds/snapshot - Get aggregated DS snapshot
router.get('/snapshot', (req: Request, res: Response) => {
  res.json({ success: true, snapshot: DSEngine.getSnapshot() });
});

// POST /api/ds/lamport/tick - Manual Lamport clock tick simulation
router.post('/lamport/tick', (req: Request, res: Response) => {
  const { serviceId, eventType } = req.body;
  const clockObj = serviceLamportClocks[serviceId] || serviceLamportClocks["order-service"];
  const newClock = clockObj.tick(eventType || "MANUAL_SIMULATION_EVENT", { triggeredBy: "UI_INSPECTOR" });
  
  eventBus.publish("ds.lamport.ticked", serviceId, "all", { serviceId, newClock });
  res.json({ success: true, serviceId, newClock, history: clockObj.getHistory() });
});

// POST /api/ds/vector/event - Manual Vector clock event
router.post('/vector/event', (req: Request, res: Response) => {
  const { serviceId, eventName } = req.body;
  const vc = serviceVectorClocks[serviceId] || serviceVectorClocks["order-service"];
  const updatedVector = vc.increment(eventName || "MANUAL_VECTOR_EVENT");
  
  eventBus.publish("ds.vector.updated", serviceId, "all", { serviceId, vector: updatedVector });
  res.json({ success: true, serviceId, vector: updatedVector, logs: vc.getLogs() });
});

// POST /api/ds/leader/election - Initiate Bully election
router.post('/leader/election', (req: Request, res: Response) => {
  const { initiatorId } = req.body;
  try {
    const result = bullyElectionInstance.startElection(Number(initiatorId) || 101);
    eventBus.publish("ds.leader.election_completed", "queue-service", "all", result);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/ds/leader/node-status - Toggle node alive state (simulates server crash / failover)
router.post('/leader/node-status', (req: Request, res: Response) => {
  const { nodeId, isAlive } = req.body;
  bullyElectionInstance.setNodeAlive(Number(nodeId), Boolean(isAlive));
  eventBus.publish("ds.leader.node_changed", "queue-service", "all", { nodeId, isAlive });
  res.json({
    success: true,
    nodes: bullyElectionInstance.getNodes(),
    leader: bullyElectionInstance.getLeader()
  });
});

// POST /api/ds/mutex/request - Request distributed critical section lock
router.post('/mutex/request', (req: Request, res: Response) => {
  const { workerId, orderId, lamportTimestamp } = req.body;
  const lTimestamp = Number(lamportTimestamp) || serviceLamportClocks["kitchen-service"].tick("MUTEX_REQUEST_PREPARE");
  const result = distributedMutexInstance.requestLock(workerId || "KitchenWorker-1", Number(orderId) || 101, lTimestamp);
  
  eventBus.publish("ds.mutex.requested", "kitchen-service", "all", { workerId, orderId, result });
  res.json({ success: true, result, activeLocks: distributedMutexInstance.getActiveLocks() });
});

// POST /api/ds/mutex/release - Release distributed lock
router.post('/mutex/release', (req: Request, res: Response) => {
  const { workerId, orderId } = req.body;
  const result = distributedMutexInstance.releaseLock(workerId || "KitchenWorker-1", Number(orderId) || 101);
  
  eventBus.publish("ds.mutex.released", "kitchen-service", "all", { workerId, orderId, result });
  res.json({ success: true, result, activeLocks: distributedMutexInstance.getActiveLocks() });
});

// POST /api/ds/rpc/call - Execute direct RPC call
router.post('/rpc/call', async (req: Request, res: Response) => {
  const { callerService, targetService, method, params } = req.body;
  const rpcRes = await rpcRegistry.call(
    callerService || "order-service",
    targetService || "kitchen-service",
    method || "checkCapacity",
    params || {}
  );
  eventBus.publish("ds.rpc.executed", callerService || "order-service", targetService || "kitchen-service", rpcRes);
  res.json({ success: true, rpcResponse: rpcRes, logs: rpcRegistry.getLogs() });
});

// GET /api/ds/eventbus/history - Get pub/sub message history
router.get('/eventbus/history', (req: Request, res: Response) => {
  res.json({ success: true, history: eventBus.getHistory() });
});

export default router;
