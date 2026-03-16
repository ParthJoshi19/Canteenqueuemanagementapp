import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { CheckCircle2, Clock, CookingPot, Package, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState } from 'react';

export interface Order {
  id: string;
  queueNumber: number;
  items: string[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  totalPrice: number;
  estimatedTime: number;
  timestamp: Date;
}

interface OrderTrackingProps {
  order: Order | null;
  onNewOrder: () => void;
}

export function OrderTracking({ order, onNewOrder }: OrderTrackingProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!order || !isVisible) {
    return null;
  }

  const getStatusInfo = () => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Order Received',
          icon: Clock,
          progress: 25,
          color: 'bg-yellow-500'
        };
      case 'preparing':
        return {
          label: 'Preparing',
          icon: CookingPot,
          progress: 60,
          color: 'bg-blue-500'
        };
      case 'ready':
        return {
          label: 'Ready for Pickup',
          icon: Package,
          progress: 90,
          color: 'bg-green-500'
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          progress: 100,
          color: 'bg-primary'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        </button>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <StatusIcon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Order #{order.queueNumber.toString().padStart(3, '0')}</CardTitle>
          <Badge className={`${statusInfo.color} text-white mt-2`}>
            {statusInfo.label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span>{statusInfo.progress}%</span>
            </div>
            <Progress value={statusInfo.progress} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Queue Number</span>
              <span className="text-2xl text-primary">#{order.queueNumber.toString().padStart(3, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Time</span>
              <span>{order.estimatedTime} mins</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Your Items:</p>
            <ul className="space-y-1">
              {order.items.map((item, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {order.status === 'ready' && (
            <div className="bg-accent/20 rounded-lg p-4 text-center">
              <p className="text-sm">
                🎉 Your order is ready! Please collect it from the counter.
              </p>
            </div>
          )}

          {order.status === 'completed' && (
            <Button onClick={onNewOrder} className="w-full bg-primary hover:bg-accent">
              Place New Order
            </Button>
          )}

          {order.status !== 'completed' && (
            <div className="space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                We'll update you as your order progresses
              </p>
              <Button 
                onClick={() => setIsVisible(false)} 
                variant="outline" 
                className="w-full"
              >
                Close Tracking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
