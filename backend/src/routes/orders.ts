import { Router, Response } from 'express';
import { Order } from '../models/Order';
import { getNextQueueNumber } from '../models/Counter';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// POST /api/orders — place a new order
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { items, totalPrice, estimatedTime } = req.body as {
      items?: string[];
      totalPrice?: number;
      estimatedTime?: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must include at least one item' });
      return;
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      res.status(400).json({ error: 'Invalid total price' });
      return;
    }
    if (typeof estimatedTime !== 'number' || estimatedTime <= 0) {
      res.status(400).json({ error: 'Invalid estimated time' });
      return;
    }

    const queueNumber = await getNextQueueNumber();

    const order = await Order.create({
      userId: req.userId,
      queueNumber,
      items,
      totalPrice,
      estimatedTime,
      status: 'pending',
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Order create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders — list current user's orders
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Orders fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/queue/info — get queue info (count of active orders, avg wait)
router.get('/queue/info', async (_req: AuthRequest, res: Response) => {
  try {
    const activeOrders = await Order.countDocuments({ status: { $in: ['pending', 'preparing'] } });
    const avgResult = await Order.aggregate([
      { $match: { status: { $in: ['pending', 'preparing'] } } },
      { $group: { _id: null, avgTime: { $avg: '$estimatedTime' } } },
    ]);
    const averageWaitTime = avgResult.length > 0 ? Math.round(avgResult[0].avgTime) : 0;

    res.json({ currentQueue: activeOrders, averageWaitTime });
  } catch (err) {
    console.error('Queue info error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/queue/all — get all orders in queue (for display/admin)
router.get('/queue/all', async (_req: AuthRequest, res: Response) => {
  try {
    const allOrders = await Order.find({
      status: { $in: ['pending', 'preparing', 'ready'] }
    })
      .sort({ queueNumber: 1 })
      .select('queueNumber status estimatedTime createdAt items totalPrice');

    res.json(allOrders);
  } catch (err) {
    console.error('Queue all error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/queue/position — get user's position in queue
router.get('/queue/position', async (req: AuthRequest, res: Response) => {
  try {
    const userOrder = await Order.findOne({
      userId: req.userId,
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    if (!userOrder) {
      res.json({ position: null, queueNumber: null, ordersAhead: 0 });
      return;
    }

    const ordersAhead = await Order.countDocuments({
      queueNumber: { $lt: userOrder.queueNumber },
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    const totalInQueue = await Order.countDocuments({
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    res.json({
      queueNumber: userOrder.queueNumber,
      position: ordersAhead + 1,
      totalInQueue,
      status: userOrder.status,
      estimatedTime: userOrder.estimatedTime
    });
  } catch (err) {
    console.error('Queue position error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id — get a specific order
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error('Order fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status — update order status (for admin/kitchen use)
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body as { status?: string };
    const validStatuses = ['pending', 'preparing', 'ready', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
