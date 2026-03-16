import { Router, Request, Response } from 'express';
import { MenuItem } from '../models/MenuItem';

const router = Router();

// GET /api/menu
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/menu/:category
router.get('/:category', async (req: Request, res: Response) => {
  try {
    const category = String(req.params.category);
    if (!['main', 'beverage', 'snack'].includes(category)) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }
    const items = await MenuItem.find({ category });
    res.json(items);
  } catch (err) {
    console.error('Menu category fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
