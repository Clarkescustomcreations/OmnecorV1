import { EventEmitter } from 'events';
import { ENV } from '../config/index.js';

export interface MeshNode {
  id: string;
  name: string;
  address: string;
  port: number;
  capabilities: string[];
}

/**
 * MeshDiscoveryService (TEMPORARY STUB)
 * Handles LAN-native auto-discovery of Omnecor nodes.
 */
export class MeshDiscoveryService extends EventEmitter {
  private static instance: MeshDiscoveryService | null = null;
  private nodes: Map<string, MeshNode> = new Map();

  private constructor() {
    super();
    // Stubbed: mDNS discovery disabled due to missing dependency
  }

  public static getInstance(): MeshDiscoveryService {
    if (!MeshDiscoveryService.instance) {
      MeshDiscoveryService.instance = new MeshDiscoveryService();
    }
    return MeshDiscoveryService.instance;
  }

  getNodes(): MeshNode[] {
    return Array.from(this.nodes.values());
  }
}
