import { useState, useEffect } from 'react';
import { MenuItem, menuItems } from '@/app/data/menu-items';
import { MenuCard } from '@/app/components/menu-card';
import { Cart } from '@/app/components/cart';
import { OrderTracking, Order } from '@/app/components/order-tracking';
import { Header } from '@/app/components/header';
import { toast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';

interface CartItem extends MenuItem {
  quantity: number;
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [queueNumber, setQueueNumber] = useState(15);

  // Simulate order status updates
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'completed') return;

    const statusSequence: Array<Order['status']> = ['pending', 'preparing', 'ready', 'completed'];
    const currentIndex = statusSequence.indexOf(currentOrder.status);
    
    if (currentIndex < statusSequence.length - 1) {
      const timeout = setTimeout(() => {
        const nextStatus = statusSequence[currentIndex + 1];
        setCurrentOrder(prev => prev ? { ...prev, status: nextStatus } : null);
        
        if (nextStatus === 'ready') {
          toast.success('Your order is ready for pickup!', {
            description: `Queue #${currentOrder.queueNumber.toString().padStart(3, '0')}`
          });
        }
      }, 5000); // Update status every 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [currentOrder]);

  const handleAddToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success('Added to cart', {
      description: item.name
    });
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.quantity > 1) {
        return prev.map(i =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== id);
    });
    toast.info('Item removed from cart');
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast.info('Cart cleared');
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const estimatedTime = Math.max(...cartItems.map(item => item.prepTime));
    const itemNames = cartItems.map(item => `${item.quantity}x ${item.name}`);

    const newOrder: Order = {
      id: Date.now().toString(),
      queueNumber: queueNumber + 1,
      items: itemNames,
      status: 'pending',
      totalPrice,
      estimatedTime,
      timestamp: new Date()
    };

    setCurrentOrder(newOrder);
    setQueueNumber(prev => prev + 1);
    setCartItems([]);
    toast.success('Order placed successfully!', {
      description: `Queue #${newOrder.queueNumber.toString().padStart(3, '0')}`
    });
  };

  const handleNewOrder = () => {
    setCurrentOrder(null);
  };

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <Header
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        queueInfo={{
          currentQueue: queueNumber,
          averageWaitTime: 8
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found in this category</p>
          </div>
        )}
      </main>

      <Cart
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onPlaceOrder={handlePlaceOrder}
        onClearCart={handleClearCart}
      />

      {currentOrder && (
        <OrderTracking order={currentOrder} onNewOrder={handleNewOrder} />
      )}
    </div>
  );
}
