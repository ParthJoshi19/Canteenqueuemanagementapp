import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  Loader2,
  LogOut,
  UtensilsCrossed,
  Clock,
  ChefHat,
  Package,
  CheckCircle2,
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { apiUrl } from '@/app/lib/api';

interface MenuItemData {
  _id: string;
  name: string;
  category: 'main' | 'beverage' | 'snack';
  price: number;
  image: string;
  prepTime: number;
  description: string;
}

interface OrderData {
  _id: string;
  userId: { _id: string; username: string; displayName?: string } | string;
  queueNumber: number;
  items: string[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  totalPrice: number;
  estimatedTime: number;
  createdAt: string;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  paymentMethod?: 'razorpay_upi' | 'razorpay_card' | 'razorpay_netbanking' | 'razorpay' | 'cash' | 'stripe_card' | 'stripe_upi';
}

interface AdminEventOrderData {
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
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  paymentMethod?: 'razorpay_upi' | 'razorpay_card' | 'razorpay_netbanking' | 'razorpay' | 'cash' | 'stripe_card' | 'stripe_upi';
  user: {
    _id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
  };
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const EMPTY_FORM = {
  name: '',
  category: 'main' as 'main' | 'beverage' | 'snack',
  price: '',
  prepTime: '',
  description: '',
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('orders');

  // Order management state
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Event & Bulk Orders state
  const [eventOrders, setEventOrders] = useState<AdminEventOrderData[]>([]);
  const [eventOrdersLoading, setEventOrdersLoading] = useState(true);
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/orders'), { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as OrderData[];
        setOrders(data);
      }
    } catch {
      // silently fail
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchEventOrders = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/event-orders'), { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as AdminEventOrderData[];
        setEventOrders(data);
      }
    } catch {
      // silently fail
    } finally {
      setEventOrdersLoading(false);
    }
  }, []);

  // Poll orders & event orders every 5 seconds
  useEffect(() => {
    fetchOrders();
    fetchEventOrders();
    const interval = setInterval(() => {
      fetchOrders();
      fetchEventOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchEventOrders]);

  const updateEventOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/event-orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = (await res.json()) as AdminEventOrderData;
        setEventOrders((prev) =>
          prev.map((e) => (e._id === updated._id || e.id === updated.id ? { ...e, status: updated.status } : e)),
        );
      }
    } catch {
      // silently fail
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = (await res.json()) as OrderData;
        setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
      }
    } catch {
      // silently fail
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/menu'), { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as MenuItemData[];
        setItems(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItemData) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      prepTime: item.prepTime.toString(),
      description: item.description,
    });
    setImageFile(null);
    setImagePreview(item.image);
    setError('');
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setError('');
    setImageFile(file);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setError('');

    if (!form.name || !form.category || !form.price || !form.prepTime || !form.description) {
      setError('All fields are required.');
      return;
    }

    if (!editingItem && !imageFile) {
      setError('Please select an image for the menu item.');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('price', form.price);
      formData.append('prepTime', form.prepTime);
      formData.append('description', form.description);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const url = editingItem
        ? apiUrl(`/api/admin/menu/${editingItem._id}`)
        : apiUrl('/api/admin/menu');

      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = (await res.json()) as MenuItemData & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save menu item.');
      } else {
        setDialogOpen(false);
        fetchItems();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/admin/menu/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchItems();
    } catch {
      // silently fail
    }
  };

  const handleLogout = async () => {
    await fetch(apiUrl('/api/admin/logout'), {
      method: 'POST',
      credentials: 'include',
    });
    onLogout();
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'main': return 'Main Dish';
      case 'beverage': return 'Beverage';
      case 'snack': return 'Snack';
      default: return cat;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'preparing': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><ChefHat className="w-3 h-3 mr-1" />Preparing</Badge>;
      case 'ready': return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><Package className="w-3 h-3 mr-1" />Ready</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextStatus = (status: string): string | null => {
    switch (status) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getNextStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Mark Completed';
      default: return '';
    }
  };

  const getPaymentBadge = (status?: string, method?: string) => {
    if (status === 'paid') {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-1.5 h-4 ml-2">
          {method?.includes('upi') ? 'UPI ⚡' : 'Card 💳'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px] px-1.5 h-4 ml-2 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
        Cash 💵
      </Badge>
    );
  };

  const getUserName = (order: OrderData): string => {
    if (typeof order.userId === 'object' && order.userId) {
      return order.userId.displayName || order.userId.username;
    }
    return 'Unknown';
  };

  const activeOrders = orders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage orders & menu</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders">
              Live Queue
              {activeOrders.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-destructive text-destructive-foreground">{activeOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Event & Bulk Orders
              {eventOrders.filter(e => e.status === 'pending').length > 0 && (
                <Badge className="ml-1.5 h-5 px-1.5 bg-amber-500 text-white font-bold">
                  {eventOrders.filter(e => e.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
          </TabsList>

          {/* ─── ORDERS TAB ─── */}
          <TabsContent value="orders">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{orders.filter(o => o.status === 'preparing').length}</div>
                  <p className="text-sm text-muted-foreground">Preparing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{orders.filter(o => o.status === 'ready').length}</div>
                  <p className="text-sm text-muted-foreground">Ready</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{completedOrders.length}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Active orders */}
            <h2 className="text-xl font-semibold mb-4">Active Queue</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active orders. All caught up!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {activeOrders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <Card key={order._id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            #{order.queueNumber.toString().padStart(3, '0')}
                          </CardTitle>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{getUserName(order)}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-1">
                          {order.items.map((item, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <span className="font-mono font-semibold text-foreground">₹{order.totalPrice.toFixed(2)}</span>
                            {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                          </div>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{order.estimatedTime}m</span>
                        </div>
                        {nextStatus && (
                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => updateOrderStatus(order._id, nextStatus)}
                          >
                            {getNextStatusLabel(order.status)}
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Completed orders */}
            {completedOrders.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-4 mt-8">Completed Today</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedOrders.slice(0, 12).map((order) => (
                    <Card key={order._id} className="opacity-70">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            #{order.queueNumber.toString().padStart(3, '0')}
                          </CardTitle>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{getUserName(order)}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {order.items.map((item, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm text-muted-foreground font-mono font-semibold">₹{order.totalPrice.toFixed(2)}</p>
                          {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── MENU TAB ─── */}
          <TabsContent value="menu">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{items.length}</div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {items.filter(i => i.category === 'main').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Main Dishes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {items.filter(i => i.category === 'beverage').length + items.filter(i => i.category === 'snack').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Beverages & Snacks</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Menu Items</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the details below.' : 'Fill in the details to add a new menu item.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                {/* Image upload */}
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div
                    className="relative border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                        <ImagePlus className="w-10 h-10" />
                        <span className="text-sm">Click to upload image</span>
                      </div>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="item-name">Name</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g. Classic Burger"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm(f => ({ ...f, category: v as 'main' | 'beverage' | 'snack' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Dish</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price & Prep time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Price (₹)</Label>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="49.00"
                      value={form.price}
                      onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-prep">Prep Time (mins)</Label>
                    <Input
                      id="item-prep"
                      type="number"
                      min="1"
                      placeholder="8"
                      value={form.prepTime}
                      onChange={(e) => setForm(f => ({ ...f, prepTime: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="item-desc">Description</Label>
                  <Textarea
                    id="item-desc"
                    rows={3}
                    placeholder="Brief description of the dish..."
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Menu grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No menu items yet. Add your first item!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item._id} className="overflow-hidden group">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
                    {categoryLabel(item.category)}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-lg font-bold text-primary font-mono">₹{item.price.toFixed(2)}</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.prepTime}m</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1">
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this item and its image. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item._id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          {/* ─── EVENT & BULK ORDERS TAB ─── */}
          <TabsContent value="events">
            {/* Event Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-5 text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {eventOrders.filter((e) => e.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {eventOrders.filter((e) => e.status === 'confirmed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {eventOrders.filter((e) => e.status === 'preparing').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Kitchen Preparing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {eventOrders.filter((e) => e.status === 'ready' || e.status === 'completed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Ready / Delivered</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setEventStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      eventStatusFilter === st
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {st === 'all' ? 'All Events' : st}
                  </button>
                ))}
              </div>

              <span className="text-xs text-muted-foreground">
                Showing{' '}
                {
                  (eventStatusFilter === 'all'
                    ? eventOrders
                    : eventOrders.filter((e) => e.status === eventStatusFilter)
                  ).length
                }{' '}
                event orders
              </span>
            </div>

            {eventOrdersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : eventOrders.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No college event orders submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(eventStatusFilter === 'all'
                  ? eventOrders
                  : eventOrders.filter((e) => e.status === eventStatusFilter)
                ).map((eventOrder) => (
                  <Card key={eventOrder._id || eventOrder.id} className="relative overflow-hidden border-border/60">
                    <CardHeader className="pb-3 bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            {eventOrder.eventName}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            ID: <span className="font-mono">{eventOrder.id.slice(0, 8).toUpperCase()}</span> • Placed by{' '}
                            <strong>{eventOrder.user?.displayName || eventOrder.user?.username || 'Guest'}</strong>
                          </p>
                        </div>
                        <div>
                          {eventOrder.status === 'pending' && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300">
                              Under Review
                            </Badge>
                          )}
                          {eventOrder.status === 'confirmed' && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300">
                              Confirmed
                            </Badge>
                          )}
                          {eventOrder.status === 'preparing' && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-300">
                              Preparing
                            </Badge>
                          )}
                          {eventOrder.status === 'ready' && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300">
                              Ready / Dispatch
                            </Badge>
                          )}
                          {eventOrder.status === 'completed' && (
                            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-zinc-300">
                              Completed
                            </Badge>
                          )}
                          {eventOrder.status === 'cancelled' && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      {/* Event Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/40">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            <strong>Date:</strong> {new Date(eventOrder.eventDate).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            <strong>Venue:</strong> {eventOrder.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>
                            <strong>Attendees:</strong> ~{eventOrder.attendeesCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            <strong>Contact:</strong> {eventOrder.contactPhone} ({eventOrder.contactName})
                          </span>
                        </div>
                      </div>

                      {/* Items Ordered Checklist */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Bulk Food & Beverage Items:
                        </span>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 bg-background/60 p-2 rounded-md border text-xs">
                          {eventOrder.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center py-0.5">
                              <span className="font-medium">
                                <strong className="text-primary mr-1.5">{it.quantity}x</strong> {it.name}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                ₹{(it.totalPrice || it.unitPrice * it.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {eventOrder.specialInstructions && (
                        <p className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 p-2 rounded">
                          <strong>Organizer Note:</strong> {eventOrder.specialInstructions}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t text-xs font-semibold">
                        <span>Total Event Order:</span>
                        <div className="flex items-center">
                          <span className="text-base text-primary font-mono font-bold">
                            ₹{Number(eventOrder.totalPrice).toFixed(2)}
                          </span>
                          {getPaymentBadge(eventOrder.paymentStatus, eventOrder.paymentMethod)}
                        </div>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        {eventOrder.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold text-xs h-8"
                              onClick={() => updateEventOrderStatus(eventOrder._id || eventOrder.id, 'confirmed')}
                            >
                              ✓ Accept & Confirm Event
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-8"
                              onClick={() => updateEventOrderStatus(eventOrder._id || eventOrder.id, 'cancelled')}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {eventOrder.status === 'confirmed' && (
                          <Button
                            size="sm"
                            className="w-full bg-orange-600 hover:bg-orange-700 font-semibold text-xs h-8"
                            onClick={() => updateEventOrderStatus(eventOrder._id || eventOrder.id, 'preparing')}
                          >
                            🍳 Start Kitchen Preparation
                          </Button>
                        )}

                        {eventOrder.status === 'preparing' && (
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs h-8"
                            onClick={() => updateEventOrderStatus(eventOrder._id || eventOrder.id, 'ready')}
                          >
                            📦 Mark Ready for Delivery / Pickup
                          </Button>
                        )}

                        {eventOrder.status === 'ready' && (
                          <Button
                            size="sm"
                            className="w-full bg-zinc-700 hover:bg-zinc-800 text-white font-semibold text-xs h-8"
                            onClick={() => updateEventOrderStatus(eventOrder._id || eventOrder.id, 'completed')}
                          >
                            ✓ Mark Event Order Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
