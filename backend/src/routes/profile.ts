import { Router, Response } from 'express';
import multer from 'multer';
import { findUserById, updateUserProfile, updateUserProfilePicture } from '../models/User.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { uploadToS3, deleteFromS3 } from '../config/s3.js';

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
    const user = req.userId ? await findUserById(req.userId) : null;
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

// PUT /api/profile — update display name, bio & profile picture
router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, bio, profilePicture } = req.body as {
      displayName?: string;
      bio?: string;
      profilePicture?: string;
    };

    const update: { displayName?: string; bio?: string; profilePicture?: string; profileCompleted: boolean } = {
      profileCompleted: true,
    };
    if (displayName !== undefined) update.displayName = displayName.trim();
    if (bio !== undefined) update.bio = bio.trim();
    if (profilePicture !== undefined) update.profilePicture = profilePicture.trim();

    const user = await updateUserProfile(req.userId!, update);
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

      const existingUser = req.userId ? await findUserById(req.userId) : null;
      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Delete old picture from S3 if it exists
      if (existingUser.profilePicture) {
        await deleteFromS3(existingUser.profilePicture);
      }

      const url = await uploadToS3(req.file.buffer, req.file.mimetype);
      await updateUserProfilePicture(req.userId!, url);

      res.json({ profilePicture: url });
    } catch (err) {
      console.error('Upload picture error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
