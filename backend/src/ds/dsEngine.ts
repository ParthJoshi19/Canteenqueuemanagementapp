/**
 * Central Distributed Systems (DS) Engine Snapshot Manager
 * 
 * Aggregates state across Lamport Clocks, Vector Clocks, Leader Election, and Mutual Exclusion
 * for inspection via REST and SSE real-time streaming to the frontend.
 */

import { serviceLamportClocks } from './lamportClock.js';
import { serviceVectorClocks } from './vectorClock.js';
import { bullyElectionInstance } from './leaderElection.js';
import { distributedMutexInstance } from './mutualExclusion.js';
import { p2pGossipInstance } from '../communication/p2pGossip.js';
import { webRTCSignalingInstance } from '../communication/webrtcSignaling.js';
import { multimediaStreamInstance } from '../communication/multimediaStream.js';

export interface DSSnapshot {
  timestamp: string;
  lamportClocks: Record<string, { clock: number; history: any[] }>;
  vectorClocks: Record<string, { vector: Record<string, number>; logs: any[] }>;
  leaderElection: {
    nodes: any[];
    leader: any;
    logs: any[];
  };
  mutualExclusion: {
    activeLocks: any[];
    queue: any[];
    logs: any[];
  };
  p2pGossip: {
    nodes: any[];
    logs: any[];
  };
  webRTC: {
    sessions: any[];
    logs: any[];
  };
  multimediaQoS: any;
}

export class DSEngine {
  public static getSnapshot(): DSSnapshot {
    const lamportSnap: Record<string, any> = {};
    Object.entries(serviceLamportClocks).forEach(([key, lc]) => {
      lamportSnap[key] = {
        clock: lc.getClock(),
        history: lc.getHistory()
      };
    });

    const vectorSnap: Record<string, any> = {};
    Object.entries(serviceVectorClocks).forEach(([key, vc]) => {
      vectorSnap[key] = {
        vector: vc.getVector(),
        logs: vc.getLogs()
      };
    });

    return {
      timestamp: new Date().toISOString(),
      lamportClocks: lamportSnap,
      vectorClocks: vectorSnap,
      leaderElection: {
        nodes: bullyElectionInstance.getNodes(),
        leader: bullyElectionInstance.getLeader(),
        logs: bullyElectionInstance.getLogs()
      },
      mutualExclusion: {
        activeLocks: distributedMutexInstance.getActiveLocks(),
        queue: distributedMutexInstance.getRequestQueue(),
        logs: distributedMutexInstance.getLogs()
      },
      p2pGossip: {
        nodes: p2pGossipInstance.getNodes(),
        logs: p2pGossipInstance.getLogs()
      },
      webRTC: {
        sessions: webRTCSignalingInstance.getSessions(),
        logs: webRTCSignalingInstance.getLogs()
      },
      multimediaQoS: multimediaStreamInstance.getStats()
    };
  }

  /**
   * Triggers an inter-service DS event (updating Lamport and Vector clocks)
   */
  public static recordInterServiceEvent(
    senderService: string,
    receiverService: string,
    eventType: string,
    payload: any = {}
  ): { senderClock: number; receiverClock: number; vector: Record<string, number> } {
    const senderLC = serviceLamportClocks[senderService] || serviceLamportClocks["order-service"];
    const receiverLC = serviceLamportClocks[receiverService] || serviceLamportClocks["queue-service"];

    // 1. Sender ticks clock
    const sClock = senderLC.tick(`SEND:${eventType} -> ${receiverService}`, payload);

    // 2. Sender vector clock increments
    const senderVC = serviceVectorClocks[senderService];
    if (senderVC) {
      senderVC.increment(`SEND ${eventType}`);
    }

    // 3. Receiver updates clock on receive
    const rClock = receiverLC.updateOnReceive(sClock, eventType, payload);

    // 4. Receiver vector clock merges
    const receiverVC = serviceVectorClocks[receiverService];
    let vectorRes: Record<string, number> = {};
    if (receiverVC && senderVC) {
      const { vector } = receiverVC.updateOnReceive(senderVC.getVector(), `RECV ${eventType}`);
      vectorRes = vector;
    }

    return { senderClock: sClock, receiverClock: rClock, vector: vectorRes };
  }
}
