"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const storeAccess_1 = require("../utils/storeAccess");
const router = (0, express_1.Router)();
function userCanWorkStore(userId, storeId) {
    const row = db_1.default.prepare(`
    SELECT 1
    FROM users u
    LEFT JOIN user_store_access usa
      ON usa.user_id = u.id AND usa.store_id = ? AND usa.access_type = 'support'
    WHERE u.id = ? AND (u.primary_store_id = ? OR usa.id IS NOT NULL)
  `).get(storeId, userId, storeId);
    return !!row;
}
router.post('/', auth_1.authenticate, (req, res) => {
    const { week_start_date, store_id, available_times } = req.body;
    const storeId = (0, storeAccess_1.parseRequestedStoreId)(store_id);
    if (!week_start_date || !Array.isArray(available_times) || !storeId || Number.isNaN(storeId)) {
        return res.status(400).json({ error: 'week_start_date, store_id and available_times are required' });
    }
    if (!userCanWorkStore(req.user.userId, storeId)) {
        return res.status(403).json({ error: 'No permission for this store' });
    }
    try {
        db_1.default.prepare('DELETE FROM available_times WHERE user_id = ? AND store_id = ? AND week_start_date = ?')
            .run(req.user.userId, storeId, week_start_date);
        const insertStmt = db_1.default.prepare('INSERT INTO available_times (user_id, store_id, week_start_date, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)');
        const insertMany = db_1.default.transaction((times) => {
            for (const time of times) {
                insertStmt.run(req.user.userId, storeId, week_start_date, time.day_of_week, time.start_time, time.end_time);
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
router.get('/my/:weekStart', auth_1.authenticate, (req, res) => {
    const { weekStart } = req.params;
    const storeId = (0, storeAccess_1.parseRequestedStoreId)(req.query.store_id);
    if (!storeId || Number.isNaN(storeId)) {
        return res.status(400).json({ error: 'store_id is required' });
    }
    try {
        const times = db_1.default.prepare(`
      SELECT at.*, s.name as store_name
      FROM available_times at
      JOIN stores s ON at.store_id = s.id
      WHERE at.user_id = ? AND at.store_id = ? AND at.week_start_date = ?
      ORDER BY at.day_of_week, at.start_time
    `).all(req.user.userId, storeId, weekStart);
        res.json(times);
    }
    catch (error) {
        console.error('Get available times error:', error);
        res.status(500).json({ error: 'Failed to get available times' });
    }
});
router.get('/all/:weekStart', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { weekStart } = req.params;
    try {
        const storeId = (0, storeAccess_1.requireManageableStore)(req, req.query.store_id);
        let query = `
      SELECT at.*, u.name as user_name, u.username, s.name as store_name
      FROM available_times at
      JOIN users u ON at.user_id = u.id
      JOIN stores s ON at.store_id = s.id
      WHERE at.week_start_date = ?
    `;
        const params = [weekStart];
        if (storeId) {
            query += ' AND at.store_id = ?';
            params.push(storeId);
        }
        else {
            const filter = (0, storeAccess_1.buildStoreFilter)('at', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
            query += filter.clause;
            params.push(...filter.params);
        }
        query += ' ORDER BY at.day_of_week, at.start_time, u.name';
        const times = db_1.default.prepare(query).all(...params);
        res.json(times);
    }
    catch (error) {
        console.error('Get all available times error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get available times' });
    }
});
router.delete('/:weekStart', auth_1.authenticate, (req, res) => {
    const { weekStart } = req.params;
    const storeId = (0, storeAccess_1.parseRequestedStoreId)(req.query.store_id);
    if (!storeId || Number.isNaN(storeId)) {
        return res.status(400).json({ error: 'store_id is required' });
    }
    try {
        db_1.default.prepare('DELETE FROM available_times WHERE user_id = ? AND store_id = ? AND week_start_date = ?')
            .run(req.user.userId, storeId, weekStart);
        res.json({ message: 'Available times deleted successfully' });
    }
    catch (error) {
        console.error('Delete available times error:', error);
        res.status(500).json({ error: 'Failed to delete available times' });
    }
});
exports.default = router;
