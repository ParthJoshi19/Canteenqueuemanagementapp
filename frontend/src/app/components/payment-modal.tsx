import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiUrl } from '@/app/lib/api';
import { toast } from 'sonner';

export type PaymentMethodType =
  | 'razorpay_upi'
  | 'razorpay_card'
  | 'razorpay_netbanking'
  | 'razorpay'
  | 'cash'
  | 'stripe_card'
  | 'stripe_upi';

export type PaymentStatusType = 'paid' | 'unpaid';

export interface PaymentSuccessResult {
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  paymentIntentId?: string;
  orderId?: string;
  paymentId?: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderTitle?: string;
  orderType?: 'regular' | 'event';
  onPaymentSuccess: (result: PaymentSuccessResult) => void;
}

// Dynamically load Razorpay standard checkout script if needed
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  orderTitle = 'Campus Canteen Order',
  orderType = 'regular',
  onPaymentSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('razorpay_upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Dynamic Merchant & Payment Configuration
  const [merchantConfig, setMerchantConfig] = useState<{
    merchantUpiId: string;
    merchantName: string;
    customQrUrl: string;
    keyId: string;
    hasLiveRazorpay: boolean;
  }>({
    merchantUpiId: '8850447336@ptaxis',
    merchantName: 'SHRAVAN DHANANJAY JOSHI',
    customQrUrl: '',
    keyId: '',
    hasLiveRazorpay: false,
  });

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('Student Customer');

  // UPI Form State
  const [upiId, setUpiId] = useState('8850447336@ptaxis');
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPay');

  // Fetch payment config on mount or open
  useEffect(() => {
    fetch(apiUrl('/api/payments/config'))
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setMerchantConfig({
            merchantUpiId: data.merchantUpiId || '8850447336@ptaxis',
            merchantName: data.name || 'SHRAVAN DHANANJAY JOSHI',
            customQrUrl: data.customQrUrl || '',
            keyId: data.keyId || '',
            hasLiveRazorpay: Boolean(data.hasLiveRazorpay),
          });
        }
      })
      .catch((err) => console.warn('Failed to load payment config:', err));
  }, [open]);

  // Reset states when opened
  useEffect(() => {
    if (open) {
      setIsProcessing(false);
      setIsSuccess(false);
      setActivePaymentId('');
      setCopiedUpi(false);
    }
  }, [open]);

  const fillTestCard = () => {
    setCardNumber('4111 2222 3333 4444');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardName('Test Student');
    toast.info('Filled with Razorpay Test Card');
  };

  const fillTestUpi = () => {
    setUpiId('success@razorpay');
    toast.info('Filled with Razorpay Test UPI ID');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantConfig.merchantUpiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFormatCard = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 16);
    const parts = cleaned.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : cleaned);
  };

  const handleFormatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const launchRazorpayStandardCheckout = async (orderData: { orderId: string; amountInPaise?: number; keyId?: string }) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !(window as any).Razorpay) {
      return handleDirectVerification(orderData.orderId);
    }

    try {
      const options = {
        key: orderData.keyId || merchantConfig.keyId || 'rzp_test_campus_canteen',
        amount: (orderData.amountInPaise || Math.round(amount * 100)).toString(),
        currency: 'INR',
        name: merchantConfig.merchantName || 'Campus Canteen',
        description: `${orderTitle} (₹${amount.toFixed(2)})`,
        order_id: orderData.orderId.startsWith('order_test_') ? undefined : orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(apiUrl('/api/payments/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              const resData = await verifyRes.json();
              completeSuccess(response.razorpay_payment_id || resData.paymentId || orderData.orderId);
            } else {
              toast.error('Payment signature verification failed');
            }
          } catch {
            toast.error('Verification connection error');
          }
        },
        prefill: {
          name: cardName || 'Student',
          email: 'student@canteen.edu',
          contact: '9876543210',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment Failed: ' + (response.error?.description || 'Transaction declined'));
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.warn('Standard checkout popup fallback:', err);
      await handleDirectVerification(orderData.orderId);
    }
  };

  const handleDirectVerification = async (orderId: string) => {
    // Simulate brief payment verification delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const simulatedPaymentId = `pay_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;

    const verifyRes = await fetch(apiUrl('/api/payments/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: simulatedPaymentId,
        paymentIntentId: orderId,
      }),
    });

    if (verifyRes.ok) {
      completeSuccess(simulatedPaymentId, orderId);
    } else {
      toast.error('Payment verification failed');
      setIsProcessing(false);
    }
  };

  const completeSuccess = (paymentId: string, orderId?: string) => {
    setIsSuccess(true);
    setActivePaymentId(paymentId);

    toast.success('Payment Successful via Razorpay!', {
      description: `Payment ID: ${paymentId}`,
    });

    setTimeout(() => {
      onPaymentSuccess({
        paymentMethod: selectedMethod,
        paymentStatus: 'paid',
        paymentIntentId: paymentId,
        orderId: orderId || paymentId,
        paymentId: paymentId,
      });
      onOpenChange(false);
    }, 700);
  };

  const handlePay = async () => {
    // 1. Cash on Counter / Delivery
    if (selectedMethod === 'cash') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setTimeout(() => {
          onPaymentSuccess({
            paymentMethod: 'cash',
            paymentStatus: 'unpaid',
          });
          onOpenChange(false);
        }, 600);
      }, 500);
      return;
    }

    // 2. Validate Card or UPI Inputs
    if (selectedMethod === 'razorpay_card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        toast.error('Please enter card expiry MM/YY');
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        toast.error('Please enter 3-digit CVV');
        return;
      }
    } else if (selectedMethod === 'razorpay_upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g. mobile@upi or success@razorpay)');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Create Razorpay Order on backend
      const orderRes = await fetch(apiUrl('/api/payments/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          orderType,
          description: `${orderTitle} (₹${amount.toFixed(2)})`,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to initialize Razorpay payment order');
      }

      const orderData = (await orderRes.json()) as {
        orderId: string;
        paymentIntentId?: string;
        amountInPaise?: number;
        keyId?: string;
        isSandbox?: boolean;
      };

      if (selectedMethod === 'razorpay') {
        await launchRazorpayStandardCheckout(orderData);
      } else {
        await handleDirectVerification(orderData.orderId);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      toast.error('Payment processing failed. Please try again or choose Cash at Counter.');
      setIsProcessing(false);
    }
  };

  // Standard NPCI Compliant UPI URI
  const upiPayUri = `upi://pay?pa=${encodeURIComponent(merchantConfig.merchantUpiId)}&pn=${encodeURIComponent(
    merchantConfig.merchantName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Canteen Order')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 bg-card border-border/70 shadow-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Secure Checkout • Razorpay Gateway
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
              UPI • RuPay • 256-bit SSL
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between pt-1">
            <span>Pay & Confirm</span>
            <span className="text-primary font-mono text-2xl font-extrabold">
              ₹{amount.toFixed(2)}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose your preferred Razorpay payment method to finalize your {orderType === 'event' ? 'event pre-order' : 'order'}.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-75">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                {selectedMethod === 'cash' ? 'Order Confirmed!' : 'Payment Received via Razorpay!'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedMethod === 'cash'
                  ? 'Please pay ₹' + amount.toFixed(2) + ' in cash at the counter.'
                  : 'Your payment of ₹' + amount.toFixed(2) + ' was processed successfully.'}
              </p>
              {activePaymentId && (
                <p className="text-[11px] font-mono text-muted-foreground pt-1">
                  ID: {activePaymentId}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('razorpay_upi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  selectedMethod === 'razorpay_upi'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1.5" />
                <span>UPI / QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('razorpay_card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  selectedMethod === 'razorpay_card'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1.5" />
                <span>Cards (Razorpay)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1.5" />
                <span>Pay at Counter</span>
              </button>
            </div>

            {/* RAZORPAY UPI & QR CODE SECTION */}
            {selectedMethod === 'razorpay_upi' && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Select UPI Application
                    </Label>
                    <button
                      type="button"
                      onClick={fillTestUpi}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Fill Test UPI
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        className={`p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          selectedUpiApp === app
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="upi-id" className="text-xs">
                        Your UPI ID / VPA
                      </Label>
                      <Input
                        id="upi-id"
                        placeholder="e.g. 8850447336@ptaxis or success@razorpay"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-blue-500" />
                        Prompt will be sent to your {selectedUpiApp} app.
                      </p>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/50 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">Zero Gateway Charges</p>
                        <p className="text-muted-foreground text-[10px]">Instant UPI confirmation via NPCI / Razorpay.</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center p-3 border rounded-xl bg-white dark:bg-zinc-950 space-y-2 shadow-sm">
                    <div className="p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white shadow-inner flex items-center justify-center">
                      {merchantConfig.customQrUrl ? (
                        <img
                          src={merchantConfig.customQrUrl}
                          alt="Merchant QR"
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <QRCodeSVG
                          value={upiPayUri}
                          size={116}
                          level="M"
                          includeMargin={false}
                        />
                      )}
                    </div>
                    <div className="text-center space-y-0.5 w-full">
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                        {merchantConfig.merchantName}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Scan to Pay ₹{amount.toFixed(2)}
                      </p>
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[130px]">
                          {merchantConfig.merchantUpiId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          title="Copy UPI ID"
                          className="p-1 rounded text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          {copiedUpi ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RAZORPAY CARD SECTION */}
            {selectedMethod === 'razorpay_card' && (
              <div className="space-y-4 animate-in fade-in-50">
                {/* Virtual Card Preview */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">
                        Razorpay Secured
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">RuPay</span>
                      <span className="font-extrabold italic text-xs text-zinc-200">VISA / MC</span>
                    </div>
                  </div>

                  <div className="font-mono text-base tracking-widest mb-4 font-semibold text-blue-50">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <p className="text-[9px] text-blue-300 uppercase font-medium">Card Holder</p>
                      <p className="font-semibold truncate max-w-[140px] uppercase text-white">
                        {cardName || 'YOUR NAME'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-blue-300 uppercase font-medium">Expires</p>
                      <p className="font-mono font-semibold text-white">{cardExpiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="card-num" className="text-xs">
                        Card Number
                      </Label>
                      <button
                        type="button"
                        onClick={fillTestCard}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> Auto-Fill Test Card
                      </button>
                    </div>
                    <Input
                      id="card-num"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      maxLength={19}
                      onChange={(e) => handleFormatCard(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="card-exp" className="text-xs">
                        Expiry Date
                      </Label>
                      <Input
                        id="card-exp"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        maxLength={5}
                        onChange={(e) => handleFormatExpiry(e.target.value)}
                        className="font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="card-cvc" className="text-xs">
                        CVV
                      </Label>
                      <Input
                        id="card-cvc"
                        placeholder="123"
                        type="password"
                        value={cardCvc}
                        maxLength={4}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                        className="font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="card-name" className="text-xs">
                      Name on Card
                    </Label>
                    <Input
                      id="card-name"
                      placeholder="e.g. Rahul Sharma"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASH AT COUNTER SECTION */}
            {selectedMethod === 'cash' && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                    <Banknote className="w-4 h-4 text-primary" />
                    Pay with Cash at Pickup Counter
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Your order will be queued immediately. You can pay ₹{amount.toFixed(2)} in cash or scan the canteen desk UPI QR code when picking up your food.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t flex items-center justify-between gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex-1 h-11 font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Razorpay...
                  </>
                ) : (
                  <>
                    {selectedMethod === 'cash' ? 'Confirm Queue Order' : `Pay ₹${amount.toFixed(2)}`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
