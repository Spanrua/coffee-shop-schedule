"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 登录
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const user = db_1.default.prepare('SELECT * FROM users WHERE username = ? AND status = ?')
            .get(username, 'active');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = bcrypt_1.default.compareSync(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            username: user.username,
            role: user.role,
        }, config_1.config.jwtSecret, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// 获取当前用户信息
router.get('/me', auth_1.authenticate, (req, res) => {
    try {
        const user = db_1.default.prepare('SELECT id, username, name, role, hourly_rate, status FROM users WHERE id = ?')
            .get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});
// 注册新用户
router.post('/register', (req, res) => {
    const { username, password, name, role = 'employee', hourly_rate = 50.0 } = req.body;
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
        const existingUser = db_1.default.prepare('SELECT id FROM users WHERE username = ?')
            .get(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        // 加密密码
        const password_hash = bcrypt_1.default.hashSync(password, 10);
        // 插入新用户
        const result = db_1.default.prepare('INSERT INTO users (username, password_hash, name, role, hourly_rate, status) VALUES (?, ?, ?, ?, ?, ?)').run(username, password_hash, name, role, hourly_rate, 'active');
        const newUserId = result.lastInsertRowid;
        // 生成token
        const token = jsonwebtoken_1.default.sign({
            userId: newUserId,
            username: username,
            role: role,
        }, config_1.config.jwtSecret, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: newUserId,
                username: username,
                name: name,
                role: role,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
exports.default = router;
