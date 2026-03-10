import { MenuItem } from '@/app/data/menu-items';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onPlaceOrder: () => void;
  onClearCart: () => void;
}

export function Cart({ items, onRemoveItem, onPlaceOrder, onClearCart }: CartProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTime = Math.max(...items.map(item => item.prepTime), 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClearCart} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={onPlaceOrder} className="flex-1 bg-primary hover:bg-accent">
                  Place Order
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
