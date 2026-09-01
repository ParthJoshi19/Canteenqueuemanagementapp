/**
 * Unit III - Synchronization: Leader Election (Bully Algorithm)
 * 
 * Selects a master coordinator node among distributed queue worker nodes.
 * The active node with the highest Process ID (Node ID) becomes the Leader/Coordinator.
 */

export interface QueueNode {
  id: number;
  name: string;
  isAlive: boolean;
  isLeader: boolean;
  lastPing: string;
}

export interface ElectionLog {
  timestamp: string;
  eventType: 'ELECTION_STARTED' | 'ELECTION_VICTORY' | 'NODE_DOWN' | 'HEARTBEAT' | 'LEADER_ANNOUNCEMENT';
  initiatorId: number;
  details: string;
}

export class BullyLeaderElection {
  private nodes: QueueNode[];
  private currentLeaderId: number | null = null;
  private logs: ElectionLog[] = [];

  constructor() {
    this.nodes = [
      { id: 101, name: "QueueWorker-Node-101", isAlive: true, isLeader: false, lastPing: new Date().toISOString() },
      { id: 102, name: "QueueWorker-Node-102", isAlive: true, isLeader: false, lastPing: new Date().toISOString() },
      { id: 103, name: "QueueWorker-Node-103", isAlive: true, isLeader: true, lastPing: new Date().toISOString() },
      { id: 104, name: "QueueWorker-Node-104", isAlive: false, isLeader: false, lastPing: new Date().toISOString() }
    ];
    this.currentLeaderId = 103;
  }

  /**
   * Triggers Bully Leader Election from initiator Node ID
   */
  public startElection(initiatorId: number): { winnerId: number; logs: ElectionLog[] } {
    this.addLog('ELECTION_STARTED', initiatorId, `Node ${initiatorId} detected missing leader and initiated Bully Election.`);

    const initiatorNode = this.nodes.find(n => n.id === initiatorId);
    if (!initiatorNode || !initiatorNode.isAlive) {
      throw new Error(`Initiator node ${initiatorId} is not active.`);
    }

    // Bully Algorithm: Initiator sends ELECTION message to all nodes with higher ID
    const higherNodes = this.nodes.filter(n => n.id > initiatorId && n.isAlive);

    let winnerId: number;

    if (higherNodes.length === 0) {
      // Initiator has highest ID among alive nodes, becomes leader immediately
      winnerId = initiatorId;
    } else {
      // Highest active node responds and takes over election
      const highestActiveNode = higherNodes.reduce((prev, curr) => (curr.id > prev.id ? curr : prev));
      this.addLog('HEARTBEAT', highestActiveNode.id, `Node ${highestActiveNode.id} answered OK to Node ${initiatorId} and took over election.`);
      winnerId = highestActiveNode.id;
    }

    // Update node leader statuses
    this.nodes.forEach(n => {
      n.isLeader = n.id === winnerId;
    });
    this.currentLeaderId = winnerId;

    this.addLog('ELECTION_VICTORY', winnerId, `Node ${winnerId} won the election and sent LEADER announcement to all active nodes.`);
    return { winnerId, logs: this.logs };
  }

  /**
   * Simulates a node failure / crash
   */
  public setNodeAlive(nodeId: number, isAlive: boolean): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.isAlive = isAlive;
      node.lastPing = new Date().toISOString();
      if (!isAlive) {
        this.addLog('NODE_DOWN', nodeId, `Node ${nodeId} (${node.name}) failed / went offline.`);
        // If leader crashed, automatically trigger election from lowest active node
        if (node.id === this.currentLeaderId) {
          node.isLeader = false;
          this.currentLeaderId = null;
          const lowestActive = this.nodes.find(n => n.isAlive);
          if (lowestActive) {
            this.startElection(lowestActive.id);
          }
        }
      } else {
        // Recovered node initiates election if it has higher ID than current leader
        if (this.currentLeaderId === null || nodeId > this.currentLeaderId) {
          this.startElection(nodeId);
        }
      }
    }
  }

  public getNodes(): QueueNode[] {
    return this.nodes;
  }

  public getLeader(): QueueNode | undefined {
    return this.nodes.find(n => n.id === this.currentLeaderId);
  }

  public getLogs(): ElectionLog[] {
    return this.logs;
  }

  private addLog(eventType: ElectionLog['eventType'], initiatorId: number, details: string): void {
    this.logs.unshift({
      timestamp: new Date().toISOString(),
      eventType,
      initiatorId,
      details
    });
    if (this.logs.length > 50) this.logs.pop();
  }
}

export const bullyElectionInstance = new BullyLeaderElection();
