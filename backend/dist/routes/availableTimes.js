"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 提交可用时间
router.post('/', auth_1.authenticate, (req, res) => {
    const { week_start_date, available_times } = req.body;
    if (!week_start_date || !Array.isArray(available_times)) {
        return res.status(400).json({ error: 'Invalid request data' });
    }
    try {
        // 删除该用户该周的旧数据
        db_1.default.prepare('DELETE FROM available_times WHERE user_id = ? AND week_start_date = ?')
            .run(req.user.userId, week_start_date);
        // 插入新数据
        const insertStmt = db_1.default.prepare('INSERT INTO available_times (user_id, week_start_date, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)');
        const insertMany = db_1.default.transaction((times) => {
            for (const time of times) {
                insertStmt.run(req.user.userId, week_start_date, time.day_of_week, time.start_time, time.end_time);
            }
        });
        insertMany(available_times);
        res.json({ message: 'Available times submitted successfully' });
    }
    catch (error) {
        console.error('Submit available times error:', error);
        res.status(500).json({ error: 'Failed to submit available times' });
    }
});
// 获取我的某周可用时间
router.get('/my/:weekStart', auth_1.authenticate, (req, res) => {
    const { weekStart } = req.params;
    try {
        const times = db_1.default.prepare('SELECT * FROM available_times WHERE user_id = ? AND week_start_date = ? ORDER BY day_of_week, start_time').all(req.user.userId, weekStart);
        res.json(times);
    }
    catch (error) {
        console.error('Get available times error:', error);
        res.status(500).json({ error: 'Failed to get available times' });
    }
});
// 获取所有员工某周可用时间（管理员）
router.get('/all/:weekStart', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { weekStart } = req.params;
    try {
        const times = db_1.default.prepare(`
      SELECT at.*, u.name as user_name, u.username
      FROM available_times at
      JOIN users u ON at.user_id = u.id
      WHERE at.week_start_date = ?
      ORDER BY at.day_of_week, at.start_time, u.name
    `).all(weekStart);
        res.json(times);
    }
    catch (error) {
        console.error('Get all available times error:', error);
        res.status(500).json({ error: 'Failed to get available times' });
    }
});
// 删除某周的可用时间提交
router.delete('/:weekStart', auth_1.authenticate, (req, res) => {
    const { weekStart } = req.params;
    try {
        db_1.default.prepare('DELETE FROM available_times WHERE user_id = ? AND week_start_date = ?')
            .run(req.user.userId, weekStart);
        res.json({ message: 'Available times deleted successfully' });
    }
    catch (error) {
        console.error('Delete available times error:', error);
        res.status(500).json({ error: 'Failed to delete available times' });
    }
});
exports.default = router;
