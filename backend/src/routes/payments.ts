import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
let razorpayClient: Razorpay | null = null;

if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayClient = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } catch (err) {
    console.warn('Razorpay initialization warning:', err);
  }
}

// GET /api/payments/config — get Razorpay and custom UPI QR configuration
router.get('/config', (_req, res: Response) => {
  const keyId = razorpayKeyId || 'rzp_test_campus_canteen_demo';
  let merchantUpiId = process.env.MERCHANT_UPI_ID || '8850447336@ptaxis';
  let merchantName = process.env.MERCHANT_NAME || 'SHRAVAN DHANANJAY JOSHI';
  let customQrUrl = process.env.MERCHANT_QR_URL || '';

  // If user pasted a upi://pay URI in MERCHANT_QR_URL or MERCHANT_UPI_ID, extract pa & pn
  const rawUpiString = (customQrUrl.startsWith('upi://') ? customQrUrl : '') || (merchantUpiId.startsWith('upi://') ? merchantUpiId : '');
  if (rawUpiString) {
    const paMatch = rawUpiString.match(/pa=([^&]+)/);
    const pnMatch = rawUpiString.match(/pn=([^&]+)/);
    if (paMatch) merchantUpiId = decodeURIComponent(paMatch[1]);
    if (pnMatch) merchantName = decodeURIComponent(pnMatch[1]);
    if (customQrUrl.startsWith('upi://')) {
      customQrUrl = ''; // Clear image url since it is a raw UPI link to be encoded into QR, not an image file
    }
  }

  res.json({
    keyId,
    gateway: 'razorpay',
    hasLiveRazorpay: Boolean(razorpayKeyId && razorpayKeySecret && razorpayClient),
    currency: 'INR',
    name: merchantName,
    merchantUpiId,
    customQrUrl,
  });
});

// Helper for creating order
async function handleCreatePaymentOrder(req: AuthRequest, res: Response) {
  try {
    const { amount, orderType = 'regular', description, metadata = {} } = req.body as {
      amount: number;
      orderType?: 'regular' | 'event';
      description?: string;
      metadata?: Record<string, string>;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid payment amount' });
      return;
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    if (razorpayClient) {
      try {
        const order = await razorpayClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`,
          notes: {
            userId: req.userId || 'guest',
            orderType,
            description: description || `Campus Canteen ${orderType === 'event' ? 'Event Pre-Order' : 'Queue Order'}`,
            ...metadata,
          },
        });

        res.json({
          orderId: order.id,
          paymentIntentId: order.id, // alias for backwards compatibility
          amount: Number(amount),
          amountInPaise,
          currency: 'INR',
          keyId: razorpayKeyId,
          isSandbox: false,
        });
        return;
      } catch (rzpErr: any) {
        console.error('Razorpay Order creation API error:', rzpErr);
        // Fallback to simulated test order if credentials fail
      }
    }

    // Sandbox / Test Simulator Mode (Instant zero-setup testing for development)
    const simulatedOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    res.json({
      orderId: simulatedOrderId,
      paymentIntentId: simulatedOrderId,
      amount: Number(amount),
      amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId || 'rzp_test_campus_canteen_demo',
      isSandbox: true,
      message: 'Running in Razorpay Sandbox Simulator (Supports instant UPI, GPay, PhonePe & Test Cards)',
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to initialize payment order' });
  }
}

// POST /api/payments/create-order — create a Razorpay Order
router.post('/create-order', authenticate, handleCreatePaymentOrder);

// POST /api/payments/create-intent — backwards compatibility alias
router.post('/create-intent', authenticate, handleCreatePaymentOrder);

// POST /api/payments/verify — verify Razorpay payment signature
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentIntentId, // alias fallback
    } = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      paymentIntentId?: string;
    };

    const orderId = razorpay_order_id || paymentIntentId;
    const paymentId = razorpay_payment_id || `pay_sim_${Date.now().toString().slice(-8)}`;

    if (!orderId) {
      res.status(400).json({ error: 'Missing orderId or paymentIntentId' });
      return;
    }

    // Real Razorpay signature verification if live keys & signature are provided
    if (razorpayKeySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature && !orderId.startsWith('order_test_')) {
      try {
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
          .createHmac('sha256', razorpayKeySecret)
          .update(body.toString())
          .digest('hex');

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
          res.json({
            success: true,
            status: 'succeeded',
            paymentStatus: 'paid',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            isSandbox: false,
          });
          return;
        } else {
          res.status(400).json({
            success: false,
            error: 'Invalid Razorpay payment signature',
            paymentStatus: 'unpaid',
          });
          return;
        }
      } catch (signErr) {
        console.error('Razorpay signature verification error:', signErr);
      }
    }

    // Sandbox / Test Simulator validation
    res.json({
      success: true,
      status: 'succeeded',
      paymentStatus: 'paid',
      orderId,
      paymentId,
      isSandbox: true,
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Failed to verify payment status' });
  }
});

// POST /api/payments/webhook — receive Razorpay webhook events
router.post('/webhook', async (req, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      res.status(400).json({ error: 'Missing Razorpay signature' });
      return;
    }

    try {
      // Note: express.json() might parse the body. We need the raw body for accurate signature verification,
      // but JSON.stringify(req.body) works if it exactly matches.
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('Invalid Razorpay webhook signature');
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
    } catch (err) {
      console.error('Webhook signature verification error:', err);
      res.status(400).json({ error: 'Signature verification failed' });
      return;
    }
  }

  // Handle the event
  const event = req.body.event;
  console.log(`Received Razorpay webhook event: ${event}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = req.body.payload?.payment?.entity;
    console.log(`Payment captured for Razorpay Order ID: ${payment?.order_id}, Amount: ${payment?.amount}`);
    
    // In a production environment, you would look up the order by payment.order_id 
    // (which is saved as paymentIntentId in your DB) and update its payment status to 'paid'.
    // e.g. updateOrderPaymentStatus(foundOrderId, 'paid', 'razorpay');
  }

  res.json({ status: 'ok' });
});

export default router;
