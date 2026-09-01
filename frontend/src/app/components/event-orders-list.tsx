import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiUrl } from '@/app/lib/api';

export interface EventOrderRecord {
  _id: string;
  id: string;
  eventName: string;
  eventDate: string;
  location: string;
  attendeesCount: number;
  contactName: string;
  contactPhone: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  specialInstructions?: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
}

interface EventOrdersListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewPreorderClick?: () => void;
}

export function EventOrdersList({
  open,
  onOpenChange,
  onNewPreorderClick,
}: EventOrdersListProps) {
  const [orders, setOrders] = useState<EventOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/event-orders'), { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as EventOrderRecord[];
        setOrders(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open]);

  const getStatusBadge = (status: EventOrderRecord['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300 gap-1">
            <Clock className="w-3 h-3" /> Under Review
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300 gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </Badge>
        );
      case 'preparing':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-300 gap-1">
            <Package className="w-3 h-3" /> Kitchen Preparing
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready for Pickup/Delivery
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-zinc-300">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-card border-border/60 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <Calendar className="w-4 h-4" />
              Event Pre-Orders
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <DialogTitle className="text-2xl font-bold">My College Event Orders</DialogTitle>
          <DialogDescription>
            Track scheduled catering and bulk food orders for campus events.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <CalendarDays className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-base">No Event Pre-Orders Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Planning a college fest, club workshop, or departmental lunch? Place a pre-order in advance!
            </p>
            {onNewPreorderClick && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onNewPreorderClick();
                }}
                className="mt-2 text-xs font-semibold"
              >
                + Place New Event Pre-Order
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {orders.map((order) => (
              <div
                key={order._id || order.id}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base text-foreground">{order.eventName}</h4>
                    <p className="text-xs text-muted-foreground">
                      Order #{order.id.slice(0, 8).toUpperCase()} • Placed on{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-card/80 p-3 rounded-lg border border-border/40">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">Date:</strong>{' '}
                      {new Date(order.eventDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      <strong className="text-foreground">Venue:</strong> {order.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">Guests:</strong> ~{order.attendeesCount}{' '}
                      people
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <strong className="text-foreground">Contact:</strong> {order.contactName} (
                    {order.contactPhone})
                  </div>
                </div>

                {/* Items preview */}
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-muted-foreground">Items Ordered:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {order.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-background rounded-md border text-[11px] font-medium"
                      >
                        <span className="text-primary font-bold">{it.quantity}x</span> {it.name}
                      </span>
                    ))}
                  </div>
                </div>

                {order.specialInstructions && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/30">
                    <strong>Note:</strong> {order.specialInstructions}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2 border-t text-xs">
                  <span className="text-muted-foreground">Total Pre-Order Value</span>
                  <span className="font-bold text-base text-primary font-mono">
                    ₹{Number(order.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
