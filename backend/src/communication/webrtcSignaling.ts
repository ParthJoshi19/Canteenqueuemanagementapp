/**
 * Unit II - Communication: WebRTC Peer-to-Peer Signaling & Data Channel Manager
 * 
 * Manages WebRTC SDP Offer/Answer exchanges, ICE Candidate distribution,
 * and direct P2P data stream sessions between student clients and canteen kitchen displays.
 */

export interface WebRTCSession {
  sessionId: string;
  clientPeerId: string;
  counterPeerId: string;
  sdpOffer?: string;
  sdpAnswer?: string;
  iceCandidatesCount: number;
  channelStatus: 'DISCONNECTED' | 'SIGNALING' | 'CONNECTED' | 'FAILED';
  connectionType: 'DIRECT_P2P' | 'STUN_NAT_TRAVERSAL' | 'TURN_RELAY';
  dataChannelLabel: string;
  bytesTransferred: number;
  lastActive: string;
}

class WebRTCSignalingManager {
  private sessions: Map<string, WebRTCSession> = new Map();
  private signalingLogs: Array<{ timestamp: string; type: string; details: any }> = [];

  constructor() {
    this.initializeDemoSessions();
  }

  private initializeDemoSessions() {
    const session1: WebRTCSession = {
      sessionId: 'WBRTC-101',
      clientPeerId: 'StudentApp-Mobile-Client-84',
      counterPeerId: 'KitchenCounter-Display-1',
      sdpOffer: 'v=0\r\no=alice 2890844526 2890844526 IN IP4 10.0.1.50\r\ns=-\r\nt=0 0\r\na=sendrecv',
      sdpAnswer: 'v=0\r\no=bob 2890844527 2890844527 IN IP4 10.0.1.11\r\ns=-\r\nt=0 0\r\na=sendrecv',
      iceCandidatesCount: 4,
      channelStatus: 'CONNECTED',
      connectionType: 'DIRECT_P2P',
      dataChannelLabel: 'liveOrderQueueSync',
      bytesTransferred: 42800,
      lastActive: new Date().toISOString()
    };

    this.sessions.set(session1.sessionId, session1);
  }

  public handleSignalingEvent(action: 'CREATE_OFFER' | 'RECEIVE_ANSWER' | 'ADD_ICE_CANDIDATE', payload: any) {
    const sessionId = payload.sessionId || `WBRTC-${Date.now()}`;
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        clientPeerId: payload.clientPeerId || 'StudentPeer-Client',
        counterPeerId: payload.counterPeerId || 'KitchenDisplay-Peer',
        iceCandidatesCount: 0,
        channelStatus: 'SIGNALING',
        connectionType: 'DIRECT_P2P',
        dataChannelLabel: 'orderStatusP2PStream',
        bytesTransferred: 0,
        lastActive: new Date().toISOString()
      };
      this.sessions.set(sessionId, session);
    }

    if (action === 'CREATE_OFFER') {
      session.sdpOffer = `v=0\r\no=client ${Date.now()} IN IP4 192.168.1.10\r\na=sendrecv`;
      session.channelStatus = 'SIGNALING';
    } else if (action === 'RECEIVE_ANSWER') {
      session.sdpAnswer = `v=0\r\no=counter ${Date.now()} IN IP4 192.168.1.20\r\na=sendrecv`;
      session.channelStatus = 'CONNECTED';
    } else if (action === 'ADD_ICE_CANDIDATE') {
      session.iceCandidatesCount += 1;
      session.bytesTransferred += 512;
    }

    session.lastActive = new Date().toISOString();

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: action,
      details: { sessionId, status: session.channelStatus, iceCandidates: session.iceCandidatesCount }
    };
    this.signalingLogs.unshift(logEntry);
    if (this.signalingLogs.length > 50) this.signalingLogs.length = 50;

    return session;
  }

  public getSessions(): WebRTCSession[] {
    return Array.from(this.sessions.values());
  }

  public getLogs() {
    return this.signalingLogs;
  }
}

export const webRTCSignalingInstance = new WebRTCSignalingManager();
