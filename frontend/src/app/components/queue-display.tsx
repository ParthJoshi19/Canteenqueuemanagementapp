import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Users, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface QueueOrder {
  _id: string;
  queueNumber: number;
  status: 'pending' | 'preparing' | 'ready';
  estimatedTime: number;
  createdAt: string;
  totalPrice: number;
}

interface QueuePosition {
  queueNumber: number | null;
  position: number | null;
  totalInQueue: number;
  status: 'pending' | 'preparing' | 'ready' | null;
  estimatedTime: number;
}

interface QueueDisplayProps {
  refreshInterval?: number; // in milliseconds
}

export function QueueDisplay({ refreshInterval = 5000 }: QueueDisplayProps) {
  const [allOrders, setAllOrders] = useState<QueueOrder[]>([]);
  const [userPosition, setUserPosition] = useState<QueuePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueData = async () => {
    try {
      const [allRes, posRes] = await Promise.all([
        fetch('http://localhost:5000/api/orders/queue/all', { credentials: 'include' }),
        fetch('http://localhost:5000/api/orders/queue/position', { credentials: 'include' })
      ]);

      if (allRes.ok) {
        const data = await allRes.json() as QueueOrder[];
        setAllOrders(data);
      }

      if (posRes.ok) {
        const data = await posRes.json() as QueuePosition;
        setUserPosition(data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch queue information');
      console.error('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      default:
        return status;
    }
  };

  if (loading && allOrders.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading queue information...
          </div>
        </CardContent>
      </Card>
    );
  }

  const estimatedWaitTime = allOrders.length > 0
    ? Math.round(allOrders.reduce((sum, order) => sum + order.estimatedTime, 0) / allOrders.length)
    : 0;

  return (
    <div className="w-full space-y-4">
      {/* User's Position Card */}
      {userPosition && userPosition.queueNumber && (
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  #{userPosition.queueNumber.toString().padStart(3, '0')}
                </div>
                <p className="text-sm text-muted-foreground">Queue Number</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {userPosition.position}
                </div>
                <p className="text-sm text-muted-foreground">
                  of {userPosition.totalInQueue}
                </p>
              </div>
              <div className="text-center">
                <Badge className={getStatusColor(userPosition.status || 'pending')}>
                  {getStatusLabel(userPosition.status || 'pending')}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">Status</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>
                  {userPosition.status === 'pending' && '0%'}
                  {userPosition.status === 'preparing' && '50%'}
                  {userPosition.status === 'ready' && '100%'}
                </span>
              </div>
              <Progress
                value={
                  userPosition.status === 'pending' ? 0
                    : userPosition.status === 'preparing' ? 50
                      : 100
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">In Queue</p>
                <p className="text-2xl font-bold">{allOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait</p>
                <p className="text-2xl font-bold">{estimatedWaitTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      {allOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Queue Display</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {allOrders.slice(0, 15).map((order) => (
                  <div
                    key={order._id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      userPosition?.queueNumber === order.queueNumber
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-xl font-bold text-primary w-12">
                        #{order.queueNumber.toString().padStart(3, '0')}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {order.estimatedTime}m
                    </div>
                  </div>
                ))}
                {allOrders.length > 15 && (
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    +{allOrders.length - 15} more orders
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {allOrders.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No orders in queue
          </CardContent>
        </Card>
      )}
    </div>
  );
}
