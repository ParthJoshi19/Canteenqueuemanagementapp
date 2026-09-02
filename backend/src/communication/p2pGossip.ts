/**
 * Unit II - Communication: Peer-to-Peer (P2P) Messaging (Gossip Protocol)
 * 
 * Demonstrates an anti-entropy / rumor-spreading Gossip Protocol where decentralized
 * canteen counter nodes (Peer Nodes) periodically exchange local order queue states
 * without relying on a central database coordinator.
 */

export interface PeerNode {
  nodeId: string;
  name: string;
  ipAddress: string;
  port: number;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  localQueueVersion: number;
  knownOrdersCount: number;
  lastGossipTimestamp: string;
}

export interface GossipMessage {
  gossipId: string;
  senderNodeId: string;
  targetNodeId: string;
  queueVersion: number;
  ordersCount: number;
  timestamp: string;
}

export class P2PGossipManager {
  private nodes: Map<string, PeerNode> = new Map();
  private gossipLogs: GossipMessage[] = [];
  private totalGossipRounds: number = 0;

  constructor() {
    this.initializePeerNodes();
  }

  private initializePeerNodes() {
    const defaultNodes: PeerNode[] = [
      {
        nodeId: 'Counter-1',
        name: 'Main Counter A',
        ipAddress: '10.0.1.11',
        port: 7001,
        status: 'ACTIVE',
        localQueueVersion: 1,
        knownOrdersCount: 5,
        lastGossipTimestamp: new Date().toISOString()
      },
      {
        nodeId: 'Counter-2',
        name: 'Express Beverage Counter',
        ipAddress: '10.0.1.12',
        port: 7002,
        status: 'ACTIVE',
        localQueueVersion: 1,
        knownOrdersCount: 5,
        lastGossipTimestamp: new Date().toISOString()
      },
      {
        nodeId: 'Counter-3',
        name: 'Snack & Bakery Bar',
        ipAddress: '10.0.1.13',
        port: 7003,
        status: 'ACTIVE',
        localQueueVersion: 1,
        knownOrdersCount: 5,
        lastGossipTimestamp: new Date().toISOString()
      },
      {
        nodeId: 'Counter-4',
        name: 'Vip Event Catering Counter',
        ipAddress: '10.0.1.14',
        port: 7004,
        status: 'ACTIVE',
        localQueueVersion: 1,
        knownOrdersCount: 5,
        lastGossipTimestamp: new Date().toISOString()
      }
    ];

    defaultNodes.forEach(node => this.nodes.set(node.nodeId, node));
  }

  /**
   * Triggers a round of Gossip Protocol across peer nodes
   */
  public triggerGossipRound(initiatorId?: string): {
    round: number;
    messagesSent: GossipMessage[];
    updatedNodes: PeerNode[];
    converged: boolean;
  } {
    this.totalGossipRounds += 1;
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.status === 'ACTIVE');
    if (activeNodes.length < 2) {
      return { round: this.totalGossipRounds, messagesSent: [], updatedNodes: Array.from(this.nodes.values()), converged: true };
    }

    const initiator = this.nodes.get(initiatorId || '') || activeNodes[Math.floor(Math.random() * activeNodes.length)];
    
    // Increment initiator's state version
    initiator.localQueueVersion += 1;
    initiator.knownOrdersCount += Math.floor(Math.random() * 3) + 1;
    initiator.lastGossipTimestamp = new Date().toISOString();

    // Select k=2 random peer nodes to rumor-spread
    const targetPeers = activeNodes
      .filter(n => n.nodeId !== initiator.nodeId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const roundMessages: GossipMessage[] = [];

    targetPeers.forEach(peer => {
      // Exchange state (Gossip Anti-Entropy)
      const highestVersion = Math.max(peer.localQueueVersion, initiator.localQueueVersion);
      const highestOrders = Math.max(peer.knownOrdersCount, initiator.knownOrdersCount);

      peer.localQueueVersion = highestVersion;
      peer.knownOrdersCount = highestOrders;
      peer.lastGossipTimestamp = new Date().toISOString();

      const msg: GossipMessage = {
        gossipId: `GSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        senderNodeId: initiator.nodeId,
        targetNodeId: peer.nodeId,
        queueVersion: highestVersion,
        ordersCount: highestOrders,
        timestamp: new Date().toISOString()
      };

      roundMessages.push(msg);
      this.gossipLogs.unshift(msg);
    });

    if (this.gossipLogs.length > 50) this.gossipLogs.length = 50;

    // Check state convergence across active peers
    const versions = activeNodes.map(n => n.localQueueVersion);
    const isConverged = versions.every(v => v === versions[0]);

    return {
      round: this.totalGossipRounds,
      messagesSent: roundMessages,
      updatedNodes: Array.from(this.nodes.values()),
      converged: isConverged
    };
  }

  public getNodes(): PeerNode[] {
    return Array.from(this.nodes.values());
  }

  public getLogs(): GossipMessage[] {
    return this.gossipLogs;
  }
}

export const p2pGossipInstance = new P2PGossipManager();
