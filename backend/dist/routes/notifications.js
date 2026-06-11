"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 获取我的通知列表
router.get('/', auth_1.authenticate, (req, res) => {
    const { unread_only } = req.query;
    try {
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [req.user.userId];
        if (unread_only === 'true') {
            query += ' AND is_read = 0';
        }
        query += ' ORDER BY created_at DESC LIMIT 50';
        const notifications = db_1.default.prepare(query).all(...params);
        res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});
// 获取未读通知数量
router.get('/unread-count', auth_1.authenticate, (req, res) => {
    try {
        const result = db_1.default.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.userId);
        res.json({ count: result.count });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});
// 标记通知为已读
router.put('/:id/read', auth_1.authenticate, (req, res) => {
    const { id } = req.params;
    try {
        const notification = db_1.default.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'No permission' });
        }
        db_1.default.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
// 标记所有通知为已读
router.put('/read-all', auth_1.authenticate, (req, res) => {
    try {
        db_1.default.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
            .run(req.user.userId);
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});
// 删除通知
router.delete('/:id', auth_1.authenticate, (req, res) => {
    const { id } = req.params;
    try {
        const notification = db_1.default.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'No permission' });
        }
        db_1.default.prepare('DELETE FROM notifications WHERE id = ?').run(id);
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// 清空已读通知
router.delete('/clear-read', auth_1.authenticate, (req, res) => {
    try {
        db_1.default.prepare('DELETE FROM notifications WHERE user_id = ? AND is_read = 1')
            .run(req.user.userId);
        res.json({ message: 'Read notifications cleared' });
    }
    catch (error) {
        console.error('Clear read notifications error:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});
exports.default = router;
