import { Router, Response } from 'express';
import multer from 'multer';
import { User } from '../models/User';
import { AuthRequest, authenticate } from '../middleware/auth';
import { uploadToS3, deleteFromS3 } from '../config/s3';

const router = Router();

// Multer stores files in memory so we can stream them to S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/profile — get current user's profile
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profilePicture: user.profilePicture,
      profileCompleted: user.profileCompleted,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile — update display name & bio
router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, bio } = req.body as { displayName?: string; bio?: string };

    const update: Record<string, unknown> = {};
    if (displayName !== undefined) update.displayName = displayName.trim();
    if (bio !== undefined) update.bio = bio.trim();
    update.profileCompleted = true;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profilePicture: user.profilePicture,
      profileCompleted: user.profileCompleted,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/picture — upload profile picture to S3
router.post(
  '/picture',
  authenticate,
  upload.single('profilePicture'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Delete old picture from S3 if it exists
      if (user.profilePicture) {
        await deleteFromS3(user.profilePicture);
      }

      const url = await uploadToS3(req.file.buffer, req.file.mimetype);

      user.profilePicture = url;
      await user.save();

      res.json({ profilePicture: url });
    } catch (err) {
      console.error('Upload picture error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
