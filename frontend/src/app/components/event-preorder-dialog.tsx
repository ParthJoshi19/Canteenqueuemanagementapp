import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { MenuItem } from '@/app/data/menu-items';
import {
  CalendarDays,
  MapPin,
  Users,
  Phone,
  User,
  Plus,
  Minus,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { apiUrl } from '@/app/lib/api';
import { toast } from 'sonner';
import { PaymentModal, PaymentSuccessResult } from './payment-modal';

interface EventOrderItem {
  itemId: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface EventPreorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: MenuItem[];
  defaultContactName?: string;
  onOrderSuccess?: () => void;
}

const COLLEGE_VENUES = [
  'Main Auditorium',
  'Seminar Hall 1',
  'Seminar Hall 2',
  'CS Dept (3rd Floor)',
  'ECE Dept (2nd Floor)',
  'Mechanical Lab Block',
  'Sports Complex / Ground',
  'Library Lawns',
  'Canteen Pickup Counter',
  'Faculty Lounge',
  'Other / Custom Venue',
];

function getTomorrowDateTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(13, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
}

export function EventPreorderDialog({
  open,
  onOpenChange,
  menuItems,
  defaultContactName = '',
  onOrderSuccess,
}: EventPreorderDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [eventName, setEventName] = useState('College Fest Refreshments');
  const [eventDate, setEventDate] = useState(() => getTomorrowDateTime());
  const [location, setLocation] = useState(COLLEGE_VENUES[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [attendeesCount, setAttendeesCount] = useState('30');
  const [contactName, setContactName] = useState(defaultContactName || 'Event Coordinator');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Bulk items mapping: itemId -> quantity
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{
    id: string;
    eventName: string;
    totalPrice: number;
  } | null>(null);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItemsList = Object.entries(selectedQuantities).map(([itemId, qty]) => {
    const item = menuItems.find((m) => m.id === itemId);
    return {
      itemId,
      name: item?.name || 'Unknown Item',
      category: item?.category,
      quantity: qty,
      unitPrice: item?.price || 0,
      totalPrice: (item?.price || 0) * qty,
    };
  });

  const totalOrderAmount = selectedItemsList.reduce((sum, item) => sum + item.totalPrice, 0);

  const initiateCheckout = () => {
    if (selectedItemsList.length === 0) {
      toast.error('Please select at least one menu item.');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (result: PaymentSuccessResult) => {
    handleSubmitOrder(result);
  };

  const handleSubmitOrder = async (paymentData: PaymentSuccessResult) => {
    if (selectedItemsList.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        eventName,
        eventDate,
        location: location === 'Other / Custom Venue' ? customLocation : location,
        attendeesCount: Number(attendeesCount),
        contactName,
        contactPhone,
        items: selectedItemsList,
        specialInstructions,
        totalPrice: totalOrderAmount,
        paymentStatus: paymentData.paymentStatus,
        paymentMethod: paymentData.paymentMethod,
        paymentIntentId: paymentData.paymentIntentId,
      };

      const res = await fetch(apiUrl('/api/event-orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { id: string; eventName: string; totalOrderAmount: number; error?: string };

      if (!res.ok) {
        toast.error(data.error || 'Failed to place event pre-order');
        setIsSubmitting(false);
      } else {
        setSubmittedOrder({
          id: data.id,
          eventName: data.eventName,
          totalOrderAmount: data.totalOrderAmount,
        });
        toast.success('Event Pre-Order Placed Successfully!', {
          description: `Order #${data.id.slice(0, 8).toUpperCase()} for ${data.eventName}`,
        });
        if (onOrderSuccess) onOrderSuccess();
      }
    } catch {
      toast.error('Network error while placing event order');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEventName('College Fest Refreshments');
    setEventDate(getTomorrowDateTime());
    setLocation(COLLEGE_VENUES[0]);
    setCustomLocation('');
    setAttendeesCount('30');
    setContactPhone('+91 98765 43210');
    setSpecialInstructions('');
    setSelectedQuantities({});
    setSubmittedOrder(null);
    setIsSubmitting(false);
  };

  const handleClose = (openVal: boolean) => {
    if (!openVal) resetForm();
    onOpenChange(openVal);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border/60 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            College Event Catering & Bulk Orders
          </div>
          <DialogTitle className="text-2xl font-bold">
            {submittedOrder ? 'Event Order Confirmed!' : 'Pre-Order for College Events'}
          </DialogTitle>
          <DialogDescription>
            {submittedOrder
              ? 'Our canteen staff has received your event request and will prepare it on schedule.'
              : 'Order snacks, beverages & meals in advance for college fests, workshops, club meets, and seminars.'}
          </DialogDescription>
        </DialogHeader>

        {submittedOrder ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20 animate-in zoom-in-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{submittedOrder.eventName}</h3>
              <p className="text-sm text-muted-foreground">
                Order ID: <span className="font-mono font-semibold text-foreground">{submittedOrder.id}</span>
              </p>
              <p className="text-xl font-extrabold text-primary pt-2 font-mono">
                Total: ₹{Number(submittedOrder.totalOrderAmount).toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl text-left text-xs space-y-1.5 border border-border/50">
              <p className="font-semibold text-foreground">Next Steps:</p>
              <p className="text-muted-foreground">• Canteen managers will review the scheduled time and prepare the bulk package.</p>
              <p className="text-muted-foreground">• Track live status under your profile's Event Pre-Orders section.</p>
            </div>

            <Button
              onClick={() => handleClose(false)}
              className="w-full h-11 text-base font-semibold"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Interactive Clickable Step Indicators */}
            <div className="flex flex-wrap items-center justify-between border-b pb-3 text-xs font-semibold gap-1.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  step === 1
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                Event Details
              </button>

              <div className="hidden sm:block w-6 h-[1px] bg-border" />

              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  step === 2
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                Select Menu & Quantities
                {(selectedItemsList.reduce((sum, item) => sum + item.quantity, 0)) > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-background/30 rounded-full text-[10px] font-bold">
                    {(selectedItemsList.reduce((sum, item) => sum + item.quantity, 0))}
                  </span>
                )}
              </button>

              <div className="hidden sm:block w-6 h-[1px] bg-border" />

              <button
                type="button"
                onClick={() => setStep(3)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  step === 3
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                Review & Confirm
              </button>
            </div>

            {/* STEP 1: EVENT DETAILS */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="space-y-1.5">
                  <Label htmlFor="eventName" className="text-xs font-medium">
                    Event / Occasion Name *
                  </Label>
                  <Input
                    id="eventName"
                    placeholder="e.g. Annual Tech Symposium, Robotics Workshop, Farewell Meet"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="eventDate" className="text-xs font-medium flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-primary" />
                      Event Date & Required Time *
                    </Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="attendeesCount" className="text-xs font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Estimated Attendees / Servings
                    </Label>
                    <Input
                      id="attendeesCount"
                      type="number"
                      min="1"
                      placeholder="e.g. 30"
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Delivery / Pickup Location on Campus *
                  </Label>
                  <select
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {COLLEGE_VENUES.map((venue) => (
                      <option key={venue} value={venue}>
                        {venue}
                      </option>
                    ))}
                  </select>

                  {location === 'Other / Custom Venue' && (
                    <Input
                      placeholder="Specify classroom, building, or lawn..."
                      className="mt-2"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName" className="text-xs font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Organizer / Contact Name *
                    </Label>
                    <Input
                      id="contactName"
                      placeholder="Your name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone" className="text-xs font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      Contact Mobile / WhatsApp *
                    </Label>
                    <Input
                      id="contactPhone"
                      placeholder="e.g. +91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90"
                  >
                    Select Menu & Quantities <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT MENU & QUANTITIES */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/40 text-xs">
                  <span className="font-semibold text-foreground">
                    Selected: {(selectedItemsList.reduce((sum, item) => sum + item.quantity, 0))} items
                  </span>
                  <span className="font-bold text-primary text-sm font-mono">
                    Est. Total: ₹{totalOrderAmount.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {menuItems.map((item) => {
                    const qty = selectedQuantities[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          qty > 0
                            ? 'bg-primary/5 border-primary/40 shadow-sm'
                            : 'bg-card/60 border-border/60 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover border"
                          />
                          <div>
                            <h4 className="text-sm font-semibold">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              ₹{item.price.toFixed(2)} each • {item.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="hidden sm:flex items-center gap-1 mr-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 5)}
                              className="px-2 py-1 text-[11px] bg-secondary hover:bg-secondary/80 rounded font-semibold text-secondary-foreground"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 10)}
                              className="px-2 py-1 text-[11px] bg-secondary hover:bg-secondary/80 rounded font-semibold text-secondary-foreground"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 25)}
                              className="px-2 py-1 text-[11px] bg-secondary hover:bg-secondary/80 rounded font-semibold text-secondary-foreground"
                            >
                              +25
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 bg-background border rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={qty <= 0}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Button variant="outline" type="button" onClick={() => setStep(1)}>
                    ← Back to Details
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90"
                  >
                    Review & Confirm Order ({(selectedItemsList.reduce((sum, item) => sum + item.quantity, 0))} items) <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & INSTRUCTIONS */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    <span className="font-semibold text-foreground">{eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(eventDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue:</span>
                    <span className="font-semibold text-foreground">
                      {location === 'Other / Custom Venue' ? customLocation : location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-semibold text-foreground">
                      {contactName} ({contactPhone})
                    </span>
                  </div>
                </div>

                {/* Selected Items summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Items Summary ({(selectedItemsList.reduce((sum, item) => sum + item.quantity, 0))} total)
                    </Label>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Edit Quantities
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {selectedItemsList.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">
                        No items selected yet.{' '}
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-primary underline font-medium"
                        >
                          Click here to select items
                        </button>
                      </p>
                    ) : (
                      selectedItemsList.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex justify-between text-xs py-1 border-b border-border/40"
                        >
                          <span>
                            <strong className="text-primary">{item.quantity}x</strong> {item.name}
                          </span>
                          <span className="font-mono font-medium">
                            ₹{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Special instructions */}
                <div className="space-y-1.5">
                  <Label htmlFor="specialInstructions" className="text-xs font-medium">
                    Special Packaging & Dietary Instructions (optional)
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="e.g. Keep 10 sandwiches vegetarian separate, deliver strictly by 12:45 PM..."
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-primary/10 rounded-xl border border-primary/20">
                  <span className="text-sm font-semibold text-foreground">Estimated Total Amount</span>
                  <span className="text-xl font-extrabold text-primary font-mono">
                    ₹{totalOrderAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button variant="outline" type="button" onClick={() => setStep(2)} disabled={isSubmitting}>
                    ← Back to Menu
                  </Button>
                  <Button
                    type="button"
                    onClick={initiateCheckout}
                    disabled={isSubmitting || selectedItemsList.length === 0}
                    className="h-11 px-6 font-semibold shadow-lg bg-primary hover:bg-primary/90 gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Please Wait...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={totalOrderAmount}
        orderTitle={eventName || 'Event Pre-Order'}
        orderType="event"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Dialog>
  );
}
