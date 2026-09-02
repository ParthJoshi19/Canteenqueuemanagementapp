/**
 * Unit I & II - Distributed Multimedia Systems & Stream-Oriented Communication
 * 
 * Continuous video/audio media stream controller demonstrating Quality of Service (QoS)
 * parameters (Jitter Buffer, Packet Loss, Latency, Adaptive Bitrate Allocation)
 * for streaming live canteen camera monitoring feeds.
 */

export interface QoSMetrics {
  streamId: string;
  cameraName: string;
  resolution: '1080p_HD' | '720p_SD' | '480p_LOW';
  frameRateFps: number;
  bitrateKbps: number;
  jitterBufferMs: number;
  packetLossPercentage: number;
  networkLatencyMs: number;
  streamQualityScore: 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'CRITICAL';
  adaptiveBitrateEnabled: boolean;
  totalFramesStreamed: number;
  lastUpdated: string;
}

class DistributedMultimediaStreamManager {
  private metrics: QoSMetrics;

  constructor() {
    this.metrics = {
      streamId: 'CAM-KITCHEN-MAIN-01',
      cameraName: 'Canteen Kitchen Live Cam 1',
      resolution: '1080p_HD',
      frameRateFps: 30,
      bitrateKbps: 4500,
      jitterBufferMs: 18,
      packetLossPercentage: 0.2,
      networkLatencyMs: 25,
      streamQualityScore: 'EXCELLENT',
      adaptiveBitrateEnabled: true,
      totalFramesStreamed: 14280,
      lastUpdated: new Date().toISOString()
    };
  }

  public getStats(): QoSMetrics {
    // Simulate continuous video frame progression & slight network variance
    this.metrics.totalFramesStreamed += 30;
    this.metrics.jitterBufferMs = Math.floor(15 + Math.random() * 12);
    this.metrics.networkLatencyMs = Math.floor(20 + Math.random() * 15);
    this.metrics.lastUpdated = new Date().toISOString();
    return this.metrics;
  }

  public updateQoS(params: {
    resolution?: '1080p_HD' | '720p_SD' | '480p_LOW';
    packetLossPercentage?: number;
    adaptiveBitrateEnabled?: boolean;
  }): QoSMetrics {
    if (params.resolution) this.metrics.resolution = params.resolution;
    if (params.packetLossPercentage !== undefined) this.metrics.packetLossPercentage = params.packetLossPercentage;
    if (params.adaptiveBitrateEnabled !== undefined) this.metrics.adaptiveBitrateEnabled = params.adaptiveBitrateEnabled;

    // Apply adaptive bitrate adaptation algorithms based on network loss & resolution
    if (this.metrics.resolution === '1080p_HD') {
      this.metrics.bitrateKbps = 4500;
      this.metrics.frameRateFps = 30;
    } else if (this.metrics.resolution === '720p_SD') {
      this.metrics.bitrateKbps = 2200;
      this.metrics.frameRateFps = 25;
    } else {
      this.metrics.bitrateKbps = 800;
      this.metrics.frameRateFps = 15;
    }

    if (this.metrics.packetLossPercentage > 5.0) {
      this.metrics.streamQualityScore = 'CRITICAL';
      if (this.metrics.adaptiveBitrateEnabled) {
        this.metrics.resolution = '480p_LOW';
        this.metrics.bitrateKbps = 800;
      }
    } else if (this.metrics.packetLossPercentage > 1.5) {
      this.metrics.streamQualityScore = 'DEGRADED';
      if (this.metrics.adaptiveBitrateEnabled) {
        this.metrics.resolution = '720p_SD';
        this.metrics.bitrateKbps = 2200;
      }
    } else {
      this.metrics.streamQualityScore = 'EXCELLENT';
    }

    this.metrics.lastUpdated = new Date().toISOString();
    return this.metrics;
  }
}

export const multimediaStreamInstance = new DistributedMultimediaStreamManager();
