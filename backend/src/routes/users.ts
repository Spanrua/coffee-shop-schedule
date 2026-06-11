import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/types';

const router = Router();

// 获取所有用户（管理员）
router.get('/', authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, hourly_rate, status, created_at FROM users ORDER BY id')
      .all() as Omit<User, 'password_hash'>[];

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 创建用户（管理员）
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { username, password, name, role, hourly_rate } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['employee', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare(
      'INSERT INTO users (username, password_hash, name, role, hourly_rate) VALUES (?, ?, ?, ?, ?)'
    ).run(username, passwordHash, name, role, hourly_rate || 50.0);

    res.status(201).json({
      id: result.lastInsertRowid,
      username,
      name,
      role,
      hourly_rate: hourly_rate || 50.0,
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 更新用户（管理员）
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, role, hourly_rate, status, password } = req.body;

  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];

    if (name !== undefined) {
      query += ', name = ?';
      params.push(name);
    }
    if (role !== undefined) {
      if (!['employee', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      query += ', role = ?';
      params.push(role);
    }
    if (hourly_rate !== undefined) {
      query += ', hourly_rate = ?';
      params.push(hourly_rate);
    }
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      query += ', status = ?';
      params.push(status);
    }
    if (password !== undefined && password !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);

    const updatedUser = db.prepare('SELECT id, username, name, role, hourly_rate, status FROM users WHERE id = ?')
      .get(id) as Omit<User, 'password_hash'>;

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 删除用户（管理员）
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;

  // 防止删除自己
  if (parseInt(id) === req.user!.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
