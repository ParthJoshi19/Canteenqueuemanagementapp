import { Router, Response } from 'express';
import {
  createEventOrder,
  findEventOrdersByUser,
  findEventOrderById,
  EventOrderItem,
  PaymentMethod,
  PaymentStatus,
} from '../models/EventOrder.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// All event-order routes require user/guest authentication
router.use(authenticate);

// POST /api/event-orders — create a new college event / bulk pre-order
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      eventName,
      eventDate,
      location,
      attendeesCount,
      contactName,
      contactPhone,
      items,
      specialInstructions,
      totalPrice,
      paymentStatus,
      paymentMethod,
      paymentIntentId,
    } = req.body as {
      eventName?: string;
      eventDate?: string;
      location?: string;
      attendeesCount?: number;
      contactName?: string;
      contactPhone?: string;
      items?: EventOrderItem[];
      specialInstructions?: string;
      totalPrice?: number;
      paymentStatus?: PaymentStatus;
      paymentMethod?: PaymentMethod;
      paymentIntentId?: string;
    };

    if (!eventName?.trim()) {
      res.status(400).json({ error: 'Event name is required' });
      return;
    }
    if (!eventDate || isNaN(new Date(eventDate).getTime())) {
      res.status(400).json({ error: 'Valid event date & time is required' });
      return;
    }
    if (!location?.trim()) {
      res.status(400).json({ error: 'College location / hall is required' });
      return;
    }
    if (!contactName?.trim() || !contactPhone?.trim()) {
      res.status(400).json({ error: 'Contact name and phone are required' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one menu item must be selected' });
      return;
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      res.status(400).json({ error: 'Invalid total price' });
      return;
    }

    const order = await createEventOrder({
      userId: req.userId!,
      eventName: eventName.trim(),
      eventDate: new Date(eventDate),
      location: location.trim(),
      attendeesCount: Number(attendeesCount) || 1,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      items,
      specialInstructions: specialInstructions?.trim() || '',
      totalPrice,
      paymentStatus: paymentStatus || 'unpaid',
      paymentMethod: paymentMethod || 'cash',
      paymentIntentId: paymentIntentId || null,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Event order create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/event-orders — get all event pre-orders for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await findEventOrdersByUser(req.userId!);
    res.json(orders);
  } catch (err) {
    console.error('Fetch event orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/event-orders/:id — get a specific event pre-order
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await findEventOrderById(String(req.params.id));
    if (!order) {
      res.status(404).json({ error: 'Event order not found' });
      return;
    }
    if (order.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error('Fetch single event order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
