"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 获取所有用户（管理员）
router.get('/', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    try {
        const users = db_1.default.prepare('SELECT id, username, name, role, hourly_rate, status, created_at FROM users ORDER BY id')
            .all();
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});
// 创建用户（管理员）
router.post('/', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    const { username, password, name, role, hourly_rate } = req.body;
    if (!username || !password || !name || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['employee', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const result = db_1.default.prepare('INSERT INTO users (username, password_hash, name, role, hourly_rate) VALUES (?, ?, ?, ?, ?)').run(username, passwordHash, name, role, hourly_rate || 50.0);
        res.status(201).json({
            id: result.lastInsertRowid,
            username,
            name,
            role,
            hourly_rate: hourly_rate || 50.0,
        });
    }
    catch (error) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// 更新用户（管理员）
router.put('/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, role, hourly_rate, status, password } = req.body;
    try {
        const user = db_1.default.prepare('SELECT id FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
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
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            query += ', password_hash = ?';
            params.push(passwordHash);
        }
        query += ' WHERE id = ?';
        params.push(id);
        db_1.default.prepare(query).run(...params);
        const updatedUser = db_1.default.prepare('SELECT id, username, name, role, hourly_rate, status FROM users WHERE id = ?')
            .get(id);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// 删除用户（管理员）
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    // 防止删除自己
    if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    try {
        const result = db_1.default.prepare('DELETE FROM users WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
