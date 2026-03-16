import { MenuItem } from '@/app/data/menu-items';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ShoppingCart, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { useState } from 'react';
import { toast } from 'sonner';

interface CartItem extends MenuItem {
  quantity: number;
}

interface OrderConfirmation {
  queueNumber: number;
  estimatedTime: number;
  totalPrice: number;
}

interface CartProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onPlaceOrder: (confirmation: OrderConfirmation) => void;
  onOrderConfirmed?: () => void;
  onClearCart: () => void;
}

export function Cart({ items, onRemoveItem, onPlaceOrder, onOrderConfirmed, onClearCart }: CartProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTime = Math.max(...items.map(item => item.prepTime), 0);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => item.id),
          totalPrice,
          estimatedTime
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error('Failed to place order', { description: error.error });
        return;
      }

      const data = await response.json();
      const confirmation: OrderConfirmation = {
        queueNumber: data.queueNumber,
        estimatedTime: data.estimatedTime,
        totalPrice: data.totalPrice
      };

      setOrderConfirmation(confirmation);
      onPlaceOrder(confirmation);
      onClearCart();
      
      toast.success('Order placed successfully!', {
        description: `Queue #${data.queueNumber.toString().padStart(3, '0')}`
      });
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Error placing order', { description: 'Please try again' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={(open) => {
      setSheetOpen(open);
      if (!open) {
        setOrderConfirmation(null);
      }
    }}>
      <SheetTrigger asChild onClick={() => setSheetOpen(true)}>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-accent" size="icon">
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        {/* Order Confirmation View */}
        {orderConfirmation ? (
          <div className="flex flex-col h-full justify-between pt-6">
            <div className="text-center space-y-6">
              <div>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Order Confirmed!</h2>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Queue Number</p>
                <p className="text-6xl font-bold text-primary">
                  #{orderConfirmation.queueNumber.toString().padStart(3, '0')}
                </p>
              </div>
              
              <div className="space-y-3 border-y py-4 bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-semibold">${orderConfirmation.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Ready Time</span>
                  <span className="font-semibold">{orderConfirmation.estimatedTime} mins</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Tip:</p>
                <p>You can track your order status in real-time. We'll notify you when it's ready for pickup!</p>
              </div>
            </div>

            <div className="flex gap-2 pb-6">
              <Button 
                onClick={() => {
                  setSheetOpen(false);
                  onOrderConfirmed?.();
                }}
                variant="outline"
                className="flex-1"
              >
                Done
              </Button>
              <Button 
                onClick={() => setOrderConfirmation(null)}
                className="flex-1"
              >
                Place Another Order
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart View */}
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
            </SheetHeader>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Add items from the menu to get started</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[calc(100vh-280px)] pr-4 mt-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 rounded-md object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="mb-1">{item.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    ${item.price.toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onRemoveItem(item.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                              <p className="text-sm mt-2 text-primary">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated time</span>
                      <span>{estimatedTime} mins</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>Total</span>
                      <span className="text-xl text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {totalPrice > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>You'll receive a queue number after placing your order.</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClearCart} className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder} 
                      className="flex-1 bg-primary hover:bg-accent"
                      disabled={isPlacingOrder || items.length === 0}
                    >
                      {isPlacingOrder ? 'Placing...' : 'Place Order'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
