import { Router } from 'express';
import { averageActiveOrderTime, countActiveOrders, countOrdersAhead, countOrdersInQueue, createOrder, findAllQueueOrders, findOrderByIdForUser, findOrdersByUser, findUserActiveOrder, updateOrderStatus, } from '../models/Order.js';
import { getNextQueueNumber } from '../models/Counter.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// All order routes require authentication
router.use(authenticate);
// POST /api/orders — place a new order
router.post('/', async (req, res) => {
    try {
        const { items, totalPrice, estimatedTime, paymentStatus, paymentMethod, paymentIntentId } = req.body;
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
        const order = await createOrder({
            userId: req.userId,
            queueNumber,
            items,
            totalPrice,
            estimatedTime,
            status: 'pending',
            paymentStatus: paymentStatus ?? 'unpaid',
            paymentMethod: paymentMethod ?? 'cash',
            paymentIntentId: paymentIntentId ?? null,
        });
        // Unit II & III: Inter-service event publication with Lamport & Vector timestamping
        try {
            const { eventBus } = await import('../communication/eventBus.js');
            eventBus.publish('ORDER_CREATED', 'order-service', 'queue-service', {
                orderId: order.id,
                queueNumber: order.queueNumber,
                itemsCount: items.length,
                totalPrice
            });
        }
        catch (dsErr) {
            console.warn('DS event emission notice:', dsErr);
        }
        res.status(201).json(order);
    }
    catch (err) {
        console.error('Order create error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders — list current user's orders
router.get('/', async (req, res) => {
    try {
        const orders = await findOrdersByUser(req.userId);
        res.json(orders);
    }
    catch (err) {
        console.error('Orders fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders/queue/info — get queue info (count of active orders, avg wait)
router.get('/queue/info', async (_req, res) => {
    try {
        const activeOrders = await countActiveOrders();
        const averageWaitTime = await averageActiveOrderTime();
        res.json({ currentQueue: activeOrders, averageWaitTime });
    }
    catch (err) {
        console.error('Queue info error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders/queue/all — get all orders in queue (for display/admin)
router.get('/queue/all', async (_req, res) => {
    try {
        const allOrders = await findAllQueueOrders();
        res.json(allOrders);
    }
    catch (err) {
        console.error('Queue all error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders/queue/position — get user's position in queue
router.get('/queue/position', async (req, res) => {
    try {
        const userOrder = await findUserActiveOrder(req.userId);
        if (!userOrder) {
            res.json({ position: null, queueNumber: null, ordersAhead: 0 });
            return;
        }
        const ordersAhead = await countOrdersAhead(userOrder.queueNumber);
        const totalInQueue = await countOrdersInQueue();
        res.json({
            queueNumber: userOrder.queueNumber,
            position: ordersAhead + 1,
            totalInQueue,
            status: userOrder.status,
            estimatedTime: userOrder.estimatedTime
        });
    }
    catch (err) {
        console.error('Queue position error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/orders/:id — get a specific order
router.get('/:id', async (req, res) => {
    try {
        const orderId = String(req.params.id);
        const order = await findOrderByIdForUser(orderId, req.userId);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json(order);
    }
    catch (err) {
        console.error('Order fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /api/orders/:id/status — update order status (for admin/kitchen use)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'preparing', 'ready', 'completed'];
        if (!status || !validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }
        const orderId = String(req.params.id);
        const order = await updateOrderStatus(orderId, status);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // Unit II & III: Inter-service event publication with Lamport & Vector timestamping
        try {
            const { eventBus } = await import('../communication/eventBus.js');
            eventBus.publish('ORDER_STATUS_CHANGED', 'kitchen-service', 'queue-service', {
                orderId: order.id,
                newStatus: status,
                queueNumber: order.queueNumber
            });
        }
        catch (dsErr) {
            console.warn('DS status emission notice:', dsErr);
        }
        res.json(order);
    }
    catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=orders.js.map