import { Router, Response } from 'express';
import multer from 'multer';
import { findUserById, findUserByUsername, verifyPassword } from '../models/User.js';
import {
  createMenuItem,
  deleteMenuItem,
  findMenuItemById,
  findMenuItems,
  updateMenuItem,
} from '../models/MenuItem.js';
import { findAllOrdersWithUser, updateOrderStatusWithUser } from '../models/Order.js';
import {
  findAllEventOrders,
  updateEventOrderStatus,
  EventOrderStatus,
} from '../models/EventOrder.js';
import { AuthRequest, authenticateAdmin, generateToken } from '../middleware/auth.js';
import { uploadToS3, deleteFromS3 } from '../config/s3.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/admin/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await findUserByUsername(username, 'admin');
    if (!user || !(await verifyPassword(user, password))) {
      res.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/me — verify admin session
router.get('/me', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.userId ? await findUserById(req.userId) : null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    console.error('Admin me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/logout
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/admin/menu — list all menu items
router.get('/menu', authenticateAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const items = await findMenuItems();
    res.json(items);
  } catch (err) {
    console.error('Admin menu list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/menu — create a menu item with image upload
router.post(
  '/menu',
  authenticateAdmin,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, category, price, prepTime, description } = req.body as {
        name?: string;
        category?: string;
        price?: string;
        prepTime?: string;
        description?: string;
      };

      if (!name || !category || !price || !prepTime || !description) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      if (!['main', 'beverage', 'snack'].includes(category)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Menu image is required' });
        return;
      }

      const imageUrl = await uploadToS3(req.file.buffer, req.file.mimetype, 'menu-images');

      const item = await createMenuItem({
        name: name.trim(),
        category: category as 'main' | 'beverage' | 'snack',
        price: parseFloat(price),
        prepTime: parseInt(prepTime, 10),
        description: description.trim(),
        image: imageUrl,
      });

      res.status(201).json(item);
    } catch (err) {
      console.error('Admin menu create error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PUT /api/admin/menu/:id — update a menu item (optionally replace image)
router.put(
  '/menu/:id',
  authenticateAdmin,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      const itemId = String(req.params.id);
      const item = await findMenuItemById(itemId);
      if (!item) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      const { name, category, price, prepTime, description } = req.body as {
        name?: string;
        category?: string;
        price?: string;
        prepTime?: string;
        description?: string;
      };

      const update: {
        name?: string;
        category?: 'main' | 'beverage' | 'snack';
        price?: number;
        prepTime?: number;
        description?: string;
        image?: string;
      } = {};

      if (name) update.name = name.trim();
      if (category && ['main', 'beverage', 'snack'].includes(category)) {
        update.category = category as 'main' | 'beverage' | 'snack';
      }
      if (price) update.price = parseFloat(price);
      if (prepTime) update.prepTime = parseInt(prepTime, 10);
      if (description) update.description = description.trim();

      if (req.file) {
        // Delete old image from S3
        if (item.image) {
          await deleteFromS3(item.image);
        }
        update.image = await uploadToS3(req.file.buffer, req.file.mimetype, 'menu-images');
      }

      const updated = await updateMenuItem(itemId, update);
      if (!updated) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      res.json(updated);
    } catch (err) {
      console.error('Admin menu update error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/admin/menu/:id — delete a menu item
router.delete('/menu/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const itemId = String(req.params.id);
    const item = await findMenuItemById(itemId);
    if (!item) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Delete image from S3
    if (item.image) {
      await deleteFromS3(item.image);
    }

    await deleteMenuItem(itemId);
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    console.error('Admin menu delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/orders — list all orders (active first, then recent)
router.get('/orders', authenticateAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await findAllOrdersWithUser();
    res.json(orders);
  } catch (err) {
    console.error('Admin orders list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/orders/:id/status — update order status
router.patch('/orders/:id/status', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body as { status?: string };
    const validStatuses = ['pending', 'preparing', 'ready', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const orderId = String(req.params.id);
    const order = await updateOrderStatusWithUser(
      orderId,
      status as 'pending' | 'preparing' | 'ready' | 'completed',
    );

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err) {
    console.error('Admin order status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/event-orders — list all event pre-orders
router.get('/event-orders', authenticateAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const eventOrders = await findAllEventOrders();
    res.json(eventOrders);
  } catch (err) {
    console.error('Admin event orders list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/event-orders/:id/status — update event pre-order status
router.patch(
  '/event-orders/:id/status',
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body as { status?: string };
      const validStatuses: EventOrderStatus[] = [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'completed',
        'cancelled',
      ];

      if (!status || !validStatuses.includes(status as EventOrderStatus)) {
        res.status(400).json({ error: 'Invalid event order status' });
        return;
      }

      const orderId = String(req.params.id);
      const updated = await updateEventOrderStatus(orderId, status as EventOrderStatus);

      if (!updated) {
        res.status(404).json({ error: 'Event order not found' });
        return;
      }

      res.json(updated);
    } catch (err) {
      console.error('Admin event order status update error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
