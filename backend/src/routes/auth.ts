import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db';
import { config } from '../config';
import { User } from '../models/types';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getStoreIdsForUser, normalizeAdminScope } from '../utils/storeAccess';

const router = Router();

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = ?')
      .get(username, 'active') as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        admin_scope: normalizeAdminScope(user.role, user.admin_scope),
        primary_store_id: user.primary_store_id,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        admin_scope: normalizeAdminScope(user.role, user.admin_scope),
        primary_store_id: user.primary_store_id,
        support_store_ids: getStoreIdsForUser(user.id, 'support'),
        managed_store_ids: getStoreIdsForUser(user.id, 'manage'),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, (req: AuthRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.username, u.name, u.role, u.admin_scope, u.primary_store_id,
             s.name as primary_store_name, u.hourly_rate, u.status
      FROM users u
      LEFT JOIN stores s ON u.primary_store_id = s.id
      WHERE u.id = ?
    `)
      .get(req.user!.userId) as Omit<User, 'password_hash'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      admin_scope: normalizeAdminScope(user.role, user.admin_scope),
      support_store_ids: getStoreIdsForUser(user.id, 'support'),
      managed_store_ids: getStoreIdsForUser(user.id, 'manage'),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// 注册新用户
router.post('/register', (req, res) => {
  const { username, password, name, role = 'employee', hourly_rate = 50.0, primary_store_id = 1 } = req.body;

  // 验证必填字段
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }

  // 验证用户名长度
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }

  // 验证密码长度
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // 验证角色
  if (role !== 'employee' && role !== 'admin') {
    return res.status(400).json({ error: 'Role must be either employee or admin' });
  }

  try {
    // 检查用户名是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?')
      .get(username);

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // 加密密码
    const password_hash = bcrypt.hashSync(password, 10);

    // 插入新用户
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, name, role, admin_scope, primary_store_id, hourly_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(username, password_hash, name, role, role === 'admin' ? 'store' : 'none', primary_store_id, hourly_rate, 'active');

    const newUserId = result.lastInsertRowid;
    db.prepare(
      'INSERT OR IGNORE INTO user_store_access (user_id, store_id, access_type) VALUES (?, ?, ?)'
    ).run(newUserId, primary_store_id, role === 'admin' ? 'manage' : 'support');

    // 生成token
    const token = jwt.sign(
      {
        userId: newUserId,
        username: username,
        name: name,
        role: role,
        admin_scope: role === 'admin' ? 'store' : 'none',
        primary_store_id,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUserId,
        username: username,
        name: name,
        role: role,
        admin_scope: role === 'admin' ? 'store' : 'none',
        primary_store_id,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
