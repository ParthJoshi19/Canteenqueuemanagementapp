import { Router } from 'express';
import { createGuestUser, createUser, findUserById, findUserByUsername, verifyPassword } from '../models/User.js';
import { authenticate, generateToken } from '../middleware/auth.js';
const router = Router();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        const existing = await findUserByUsername(username);
        if (existing) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }
        const user = await createUser({ username, password });
        const token = generateToken(user.id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(201).json({ id: user.id, username: user.username });
    }
    catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        const user = await findUserByUsername(username);
        if (!user || !(await verifyPassword(user, password))) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        const token = generateToken(user.id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ id: user.id, username: user.username });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/guest
router.post('/guest', async (req, res) => {
    try {
        const { displayName, profilePicture, bio } = req.body;
        const user = await createGuestUser({ displayName, profilePicture, bio });
        const token = generateToken(user.id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            profilePicture: user.profilePicture,
            profileCompleted: user.profileCompleted,
            role: user.role,
        });
    }
    catch (err) {
        console.error('Guest login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
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
            role: user.role,
        });
    }
    catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/logout
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});
export default router;
//# sourceMappingURL=auth.js.map