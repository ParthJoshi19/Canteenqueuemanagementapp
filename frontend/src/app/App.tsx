import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/app/data/menu-items';
import { Login } from '@/app/components/login';
import { Signup } from '@/app/components/signup';
import { ProfileSetup } from '@/app/components/profile-setup';
import { AdminLogin } from '@/app/components/admin-login';
import { AdminDashboard } from '@/app/components/admin-dashboard';
import { MenuCard } from '@/app/components/menu-card';
import { Cart } from '@/app/components/cart';
import { OrderTracking, Order } from '@/app/components/order-tracking';
import { QueueDisplay } from '@/app/components/queue-display';
import { Header } from '@/app/components/header';
import { toast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  profileCompleted: boolean;
  role: 'user' | 'admin';
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function App() {
  // Auth state is verified via the httpOnly cookie on the backend
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'admin'>('login');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then((data: UserProfile) => {
        if (data.role === 'admin') {
          setIsAdmin(true);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(true);
          setUserProfile(data);
          if (!data.profileCompleted) setShowProfileSetup(true);
        }
      })
      .catch(() => {});
  }, []);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [backendMenuItems, setBackendMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [queueInfo, setQueueInfo] = useState({ currentQueue: 0, averageWaitTime: 0 });
  const [showQueueDisplay, setShowQueueDisplay] = useState(false);

  // Fetch menu items from backend
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/menu', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as Array<{ _id: string; name: string; category: 'main' | 'beverage' | 'snack'; price: number; image: string; prepTime: number; description: string }>;
        setBackendMenuItems(data.map(item => ({ ...item, id: item._id })));
      }
    } catch {
      // silently fail
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // Fetch queue info from backend
  const fetchQueueInfo = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders/queue/info', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { currentQueue: number; averageWaitTime: number };
        setQueueInfo(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch active order for user (restore on login/reload)
  const fetchActiveOrder = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders', { credentials: 'include' });
      if (res.ok) {
        const orders = (await res.json()) as Array<{ _id: string; queueNumber: number; items: string[]; status: Order['status']; totalPrice: number; estimatedTime: number; createdAt: string }>;
        const active = orders.find(o => o.status !== 'completed');
        if (active) {
          setCurrentOrder({
            id: active._id,
            queueNumber: active.queueNumber,
            items: active.items,
            status: active.status,
            totalPrice: active.totalPrice,
            estimatedTime: active.estimatedTime,
            timestamp: new Date(active.createdAt),
          });
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      fetchMenu();
      fetchQueueInfo();
      fetchActiveOrder();
    }
  }, [isAuthenticated, isAdmin, fetchMenu, fetchQueueInfo, fetchActiveOrder]);

  // Poll order status from backend
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'completed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${currentOrder.id}`, { credentials: 'include' });
        if (res.ok) {
          const data = (await res.json()) as { _id: string; queueNumber: number; items: string[]; status: Order['status']; totalPrice: number; estimatedTime: number; createdAt: string };
          const prevStatus = currentOrder.status;
          setCurrentOrder({
            id: data._id,
            queueNumber: data.queueNumber,
            items: data.items,
            status: data.status,
            totalPrice: data.totalPrice,
            estimatedTime: data.estimatedTime,
            timestamp: new Date(data.createdAt),
          });

          if (prevStatus !== 'ready' && data.status === 'ready') {
            toast.success('Your order is ready for pickup!', {
              description: `Queue #${data.queueNumber.toString().padStart(3, '0')}`
            });
          }
        }
      } catch {
        // silently fail
      }
    }, 5000);

    return () => clearInterval(interval);
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

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const estimatedTime = Math.max(...cartItems.map(item => item.prepTime));
    const itemNames = cartItems.map(item => `${item.quantity}x ${item.name}`);

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: itemNames, totalPrice, estimatedTime }),
      });

      if (res.ok) {
        const data = (await res.json()) as { _id: string; queueNumber: number; items: string[]; status: Order['status']; totalPrice: number; estimatedTime: number; createdAt: string };
        const newOrder: Order = {
          id: data._id,
          queueNumber: data.queueNumber,
          items: data.items,
          status: data.status,
          totalPrice: data.totalPrice,
          estimatedTime: data.estimatedTime,
          timestamp: new Date(data.createdAt),
        };
        setCurrentOrder(newOrder);
        setCartItems([]);
        fetchQueueInfo();
        toast.success('Order placed successfully!', {
          description: `Queue #${newOrder.queueNumber.toString().padStart(3, '0')}`
        });
      } else {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? 'Failed to place order');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  const handleNewOrder = () => {
    setCurrentOrder(null);
    fetchQueueInfo();
  };

  const filteredItems = selectedCategory === 'all'
    ? backendMenuItems
    : backendMenuItems.filter(item => item.category === selectedCategory);

  if (isAdmin) {
    return <AdminDashboard onLogout={async () => {
      await fetch('http://localhost:5000/api/admin/logout', { method: 'POST', credentials: 'include' });
      setIsAdmin(false);
      setIsAuthenticated(false);
      setAuthView('login');
    }} />;
  }

  if (!isAuthenticated) {
    if (authView === 'admin') {
      return (
        <AdminLogin
          onLogin={() => { setIsAdmin(true); setIsAuthenticated(true); }}
          onBackToUser={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'signup') {
      return (
        <Signup
          onSignup={() => {
            fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
              .then(res => res.ok ? res.json() : null)
              .then((data: UserProfile | null) => {
                if (data) {
                  setUserProfile(data);
                }
                setIsAuthenticated(true);
                setShowProfileSetup(true);
              })
              .catch(() => {
                setIsAuthenticated(true);
                setShowProfileSetup(true);
              });
          }}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onLogin={() => {
          // Fetch profile to check if it's complete or if user is admin
          fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then((data: UserProfile | null) => {
              if (data) {
                if (data.role === 'admin') {
                  setIsAdmin(true);
                  setIsAuthenticated(true);
                  return;
                }
                setUserProfile(data);
                if (!data.profileCompleted) setShowProfileSetup(true);
              }
              setIsAuthenticated(true);
            })
            .catch(() => setIsAuthenticated(true));
        }}
        onSwitchToSignup={() => setAuthView('signup')}
        onSwitchToAdmin={() => setAuthView('admin')}
      />
    );
  }

  if (isAuthenticated && showProfileSetup) {
    return (
      <ProfileSetup
        user={userProfile ?? { id: '', username: '', displayName: '', bio: '', profilePicture: '', profileCompleted: false }}
        onComplete={(updated) => {
          setUserProfile({ ...updated, role: userProfile?.role ?? 'user' });
          setShowProfileSetup(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      <Header
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        queueInfo={queueInfo}
        userProfile={userProfile ? {
          displayName: userProfile.displayName,
          profilePicture: userProfile.profilePicture,
          username: userProfile.username,
        } : undefined}
        onProfileClick={() => setShowProfileSetup(true)}
        onLogout={async () => {
          await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
          setIsAuthenticated(false);
          setUserProfile(null);
          setAuthView('login');
          setCartItems([]);
          setCurrentOrder(null);
        }}
      />

      <main className="container mx-auto px-4 py-8">
        {!showQueueDisplay ? (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowQueueDisplay(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                📊 View Queue ({queueInfo.currentQueue})
              </button>
            </div>

            {menuLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setShowQueueDisplay(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              ← Back to Menu
            </button>
            <QueueDisplay refreshInterval={4000} />
          </div>
        )}
      </main>

      <Cart
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onPlaceOrder={(confirmation) => {
          // Refresh queue info when order is placed
          fetchQueueInfo();
        }}
        onOrderConfirmed={() => {
          // Fetch active order after user confirms they're done
          // fetchActiveOrder();
        }}
        onClearCart={handleClearCart}
      />

      {currentOrder && (
        <OrderTracking order={currentOrder} onNewOrder={handleNewOrder} />
      )}
    </div>
  );
}

