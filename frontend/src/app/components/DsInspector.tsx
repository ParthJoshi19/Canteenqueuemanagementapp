import React, { useState, useEffect } from 'react';
import { Network, Cpu, ShieldCheck, Zap, Radio, RefreshCw, Activity, CheckCircle2, AlertTriangle, Layers, Server } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface DsInspectorProps {
  apiBaseUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DsInspector({ apiBaseUrl = 'http://localhost:3000', isOpen, onClose }: DsInspectorProps) {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('unit3');
  const [connected, setConnected] = useState<boolean>(false);
  const [rpcLogs, setRpcLogs] = useState<any[]>([]);
  const [rpcParams, setRpcParams] = useState({ target: 'kitchen-service', method: 'checkCapacity' });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchSnapshot = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/ds/snapshot`);
      const data = await res.json();
      if (data.success) {
        setSnapshot(data.snapshot);
      }
    } catch (err) {
      console.error('Failed to fetch DS snapshot:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchSnapshot();

    // Setup Real-time SSE Stream (Unit II Stream-Oriented Communication)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${apiBaseUrl}/api/ds/stream`);
      
      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.snapshot) {
            setSnapshot(parsed.snapshot);
          }
        } catch (e) {
          console.error('SSE JSON parse error:', e);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch (e) {
      console.warn('EventSource initialization notice:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen, apiBaseUrl]);

  // Algorithm Action Triggers
  const handleLamportTick = async (serviceId: string) => {
    setLoadingAction(`lamport-${serviceId}`);
    try {
      await fetch(`${apiBaseUrl}/api/ds/lamport/tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, eventType: 'UI_MANUAL_INSPECTOR_TICK' })
      });
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVectorEvent = async (serviceId: string) => {
    setLoadingAction(`vector-${serviceId}`);
    try {
      await fetch(`${apiBaseUrl}/api/ds/vector/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, eventName: 'UI_CAUSAL_STATE_UPDATE' })
      });
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartElection = async (initiatorId: number) => {
    setLoadingAction('election');
    try {
      await fetch(`${apiBaseUrl}/api/ds/leader/election`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiatorId })
      });
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleNode = async (nodeId: number, currentAlive: boolean) => {
    setLoadingAction(`node-${nodeId}`);
    try {
      await fetch(`${apiBaseUrl}/api/ds/leader/node-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, isAlive: !currentAlive })
      });
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestLock = async (workerId: string, orderId: number) => {
    setLoadingAction('request-lock');
    try {
      await fetch(`${apiBaseUrl}/api/ds/mutex/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, orderId })
      });
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReleaseLock = async (workerId: string, orderId: number) => {
    setLoadingAction('release-lock');
    try {
      await fetch(`${apiBaseUrl}/api/ds/mutex/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, orderId })
      });
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExecuteRpc = async () => {
    setLoadingAction('rpc');
    try {
      const res = await fetch(`${apiBaseUrl}/api/ds/rpc/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerService: 'order-service',
          targetService: rpcParams.target,
          method: rpcParams.method,
          params: { items: ['Samosa', 'Chai'] }
        })
      });
      const data = await res.json();
      if (data.logs) {
        setRpcLogs(data.logs);
      }
      await fetchSnapshot();
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col text-card-foreground">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Distributed Systems Inspector</h2>
                <Badge variant={connected ? "default" : "secondary"} className="text-xs">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  {connected ? "Live Stream SSE Connected" : "Polling Mode"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time algorithm monitor: Lamport Clocks, Vector Clocks, Bully Leader Election & Mutex Lock
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchSnapshot} className="h-8 gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Snapshot
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs">
              ✕ Close
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-border bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="unit3" className="text-xs font-semibold">
                Unit III: Synchronization
              </TabsTrigger>
              <TabsTrigger value="unit2" className="text-xs font-semibold">
                Unit II: Communication (RPC & SSE)
              </TabsTrigger>
              <TabsTrigger value="unit1" className="text-xs font-semibold">
                Unit I: Microservices Topology
              </TabsTrigger>
              <TabsTrigger value="unit4" className="text-xs font-semibold">
                Unit IV: Cloud & K8s Manifests
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* UNIT III: SYNCHRONIZATION ALGORITHMS */}
          {activeTab === 'unit3' && (
            <div className="space-y-6">
              
              {/* 1. Lamport Logical Clocks */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        1. Lamport Logical Clocks (Event Total Ordering)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Rule: L = L + 1 on local tick; L_local = max(L_local, L_remote) + 1 on receive.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {snapshot?.lamportClocks && Object.entries(snapshot.lamportClocks).map(([service, info]: [string, any]) => (
                      <div key={service} className="p-3 bg-muted/30 border rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase">{service}</div>
                          <div className="text-3xl font-extrabold text-primary my-1">
                            L = {info.clock}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2 text-xs h-7 w-full"
                          disabled={loadingAction === `lamport-${service}`}
                          onClick={() => handleLamportTick(service)}
                        >
                          Tick Clock (+1)
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Lamport History Trace */}
                  <div className="bg-muted/20 rounded-md p-3 text-xs space-y-1 max-h-36 overflow-y-auto border">
                    <div className="font-semibold text-muted-foreground mb-1">Recent Lamport Event Logs:</div>
                    {snapshot?.lamportClocks?.["order-service"]?.history?.slice(0, 5).map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between font-mono text-[11px] py-0.5 border-b border-border/40">
                        <span className="text-primary font-bold">L={h.clock} [{h.serviceId}]</span>
                        <span className="truncate max-w-md text-foreground">{h.eventType}</span>
                        <span className="text-muted-foreground text-[10px]">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 2. Vector Clocks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    2. Vector Clocks (Causal Dependency Tracking)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Vector Structure: [OrderService, QueueService, KitchenService]. Detects concurrency and causality.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {snapshot?.vectorClocks && Object.entries(snapshot.vectorClocks).map(([service, info]: [string, any]) => (
                      <div key={service} className="p-3 bg-muted/30 border rounded-lg">
                        <div className="text-xs font-medium text-muted-foreground uppercase">{service}</div>
                        <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 my-1 bg-background px-2 py-1 rounded border">
                          {JSON.stringify(info.vector)}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2 text-xs h-7 w-full"
                          disabled={loadingAction === `vector-${service}`}
                          onClick={() => handleVectorEvent(service)}
                        >
                          Increment Vector
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 3. Bully Leader Election */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-500" />
                        3. Leader Election (Bully Algorithm)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        The alive QueueWorker node with the highest Process ID (Node ID) is elected Coordinator.
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="default"
                      disabled={loadingAction === 'election'}
                      onClick={() => handleStartElection(101)}
                      className="h-8 text-xs gap-1"
                    >
                      Trigger Bully Election
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {snapshot?.leaderElection?.nodes?.map((node: any) => (
                      <div 
                        key={node.id} 
                        className={`p-3 border rounded-lg flex flex-col justify-between ${
                          node.isLeader 
                            ? 'bg-emerald-500/10 border-emerald-500/40' 
                            : node.isAlive 
                            ? 'bg-muted/30 border-border' 
                            : 'bg-destructive/10 border-destructive/30 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs">Node #{node.id}</span>
                            {node.isLeader && <Badge className="bg-emerald-600 text-[10px] px-1.5 py-0">LEADER</Badge>}
                          </div>
                          <div className="text-xs font-semibold mt-1">{node.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Status: {node.isAlive ? "ONLINE" : "CRASHED / OFFLINE"}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant={node.isAlive ? "destructive" : "outline"}
                          className="mt-3 text-[11px] h-6"
                          disabled={loadingAction === `node-${node.id}`}
                          onClick={() => handleToggleNode(node.id, node.isAlive)}
                        >
                          {node.isAlive ? "Simulate Crash" : "Recover Node"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 4. Distributed Mutual Exclusion */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    4. Distributed Mutual Exclusion (Ricart-Agrawala)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Guarantees exclusive kitchen station lock on orders so two chefs never cook the same order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      disabled={loadingAction === 'request-lock'}
                      onClick={() => handleRequestLock('KitchenStation-1', 101)}
                    >
                      Station #1 Lock Order #101
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      disabled={loadingAction === 'request-lock'}
                      onClick={() => handleRequestLock('KitchenStation-2', 101)}
                    >
                      Station #2 Lock Order #101 (Conflict)
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="text-xs"
                      disabled={loadingAction === 'release-lock'}
                      onClick={() => handleReleaseLock('KitchenStation-1', 101)}
                    >
                      Release Station #1 Lock
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-muted/30 border rounded-lg">
                      <div className="font-semibold mb-1">Active Critical Section Locks:</div>
                      {snapshot?.mutualExclusion?.activeLocks?.length === 0 ? (
                        <span className="text-muted-foreground text-[11px]">No active locks. Critical section free.</span>
                      ) : (
                        snapshot?.mutualExclusion?.activeLocks?.map((l: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1 border-b border-border/40 font-mono">
                            <span>Order #{l.orderId}</span>
                            <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-400">
                              Held by {l.workerId} (Lamport t={l.timestamp})
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 bg-muted/30 border rounded-lg">
                      <div className="font-semibold mb-1">Ricart-Agrawala Priority Request Queue:</div>
                      {snapshot?.mutualExclusion?.queue?.length === 0 ? (
                        <span className="text-muted-foreground text-[11px]">Request queue empty.</span>
                      ) : (
                        snapshot?.mutualExclusion?.queue?.map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1 border-b border-border/40 font-mono">
                            <span>Order #{r.orderId} from {r.workerId}</span>
                            <span className="text-amber-500 font-bold">Waiting (t={r.lamportTimestamp})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* UNIT II: COMMUNICATION */}
          {activeTab === 'unit2' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Synchronous RPC Call Execution Tester
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Issue direct RPC request from Order Service to Kitchen / Queue Service endpoints.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <select 
                      className="text-xs bg-background border border-border rounded px-3 py-1.5"
                      value={rpcParams.method}
                      onChange={(e) => setRpcParams({ ...rpcParams, method: e.target.value })}
                    >
                      <option value="checkCapacity">kitchen-service: checkCapacity()</option>
                      <option value="reserveStock">kitchen-service: reserveStock()</option>
                      <option value="calculateWaitTime">queue-service: calculateWaitTime()</option>
                    </select>

                    <Button size="sm" onClick={handleExecuteRpc} disabled={loadingAction === 'rpc'} className="text-xs">
                      Execute Synchronous RPC
                    </Button>
                  </div>

                  <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg overflow-x-auto max-h-60">
                    <div className="text-gray-500 mb-2">// RPC Call Logs Output</div>
                    {rpcLogs.length === 0 ? (
                      <span className="text-gray-600">Click "Execute Synchronous RPC" to issue inter-service call...</span>
                    ) : (
                      rpcLogs.map((log: any, idx: number) => (
                        <div key={idx} className="mb-2 border-b border-gray-800 pb-2">
                          <div>[RPC ID: {log.request.rpcId}] {log.request.callerService} ➔ {log.request.targetService}.{log.request.method}()</div>
                          <div className="text-yellow-300">Lamport Timestamp Attached: L={log.request.lamportClock}</div>
                          <div className="text-white mt-1">Result: {JSON.stringify(log.response.result)}</div>
                          <div className="text-gray-400 text-[10px]">Execution duration: {log.response.executionTimeMs}ms</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* UNIT I: TOPOLOGY */}
          {activeTab === 'unit1' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Microservices Architecture & Container Topology</CardTitle>
                  <CardDescription className="text-xs">
                    Demonstrating virtualization via isolated Docker services orchestrated by Docker Compose.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "Order Service", port: "3001", role: "Menu, Cart, Payments", status: "HEALTHY" },
                      { name: "Queue Service", port: "3002", role: "Live SSE & Wait Times", status: "HEALTHY" },
                      { name: "Kitchen Service", port: "3003", role: "Order Prep & Mutex", status: "HEALTHY" },
                      { name: "Notification Worker", port: "3004", role: "Serverless Alerts", status: "HEALTHY" }
                    ].map((svc, i) => (
                      <div key={i} className="p-4 border rounded-xl bg-muted/20 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center font-bold">
                          S{i+1}
                        </div>
                        <div className="font-bold text-sm">{svc.name}</div>
                        <div className="text-xs text-muted-foreground">{svc.role}</div>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-400">
                          Port {svc.port} • {svc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* UNIT IV: KUBERNETES & CLOUD */}
          {activeTab === 'unit4' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cloud Deployment & Kubernetes Specs</CardTitle>
                  <CardDescription className="text-xs">
                    k8s/ directory containing Deployment, ClusterIP Services, Ingress & Horizontal Pod Autoscaling (HPA).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs text-foreground space-y-1">
                    <div className="text-primary font-bold">$ kubectl get pods -n canteen</div>
                    <div>order-service-deployment-7f89d-x1a2b    1/1   Running   0   4m</div>
                    <div>queue-service-deployment-5c67e-y3b4c    1/1   Running   0   4m</div>
                    <div>queue-service-deployment-5c67e-z9k0l    1/1   Running   0   4m (HPA Scaled)</div>
                    <div>kitchen-service-deployment-9d21f-m4n5o   1/1   Running   0   4m</div>
                    <div>canteen-postgres-0                       1/1   Running   0   4m</div>
                    <div>canteen-redis-pubsub-0                   1/1   Running   0   4m</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
