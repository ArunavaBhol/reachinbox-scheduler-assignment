import { Router } from 'express';
import { pool } from '../config/prisma';

const router = Router();

// Mock/Real Google OAuth Callback handler receiving profile from frontend or redirect
router.post('/google-login', async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let userRes = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    let user;

    if (userRes.rows.length === 0) {
      const newUser = await pool.query(
        'INSERT INTO "User" (id, email, name, avatar, "googleId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [email, name || 'User', avatar || '', googleId || 'google-id']
      );
      user = newUser.rows[0];
    } else {
      user = userRes.rows[0];
      // Update avatar/name if changed
      await pool.query('UPDATE "User" SET name = $1, avatar = $2 WHERE id = $3', [name, avatar, user.id]);
    }

    return res.json({ success: true, user });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;