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
router.get('/shift-requirements', auth_1.authenticate, (req, res) => {
    try {
        let query = 'SELECT * FROM shift_requirements WHERE 1=1';
        const params = [];
        const storeId = (0, storeAccess_1.parseRequestedStoreId)(req.query.store_id);
        if (storeId && !Number.isNaN(storeId)) {
            query += ' AND store_id = ?';
            params.push(storeId);
        }
        else if (req.user.role === 'admin') {
            const filter = (0, storeAccess_1.buildStoreFilter)('shift_requirements', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
            query += filter.clause;
            params.push(...filter.params);
        }
        query += ' ORDER BY store_id, day_of_week, time_slot_start';
        const requirements = db_1.default.prepare(query).all(...params);
        res.json(requirements);
    }
    catch (error) {
        console.error('Get shift requirements error:', error);
        res.status(500).json({ error: 'Failed to get shift requirements' });
    }
});
router.put('/shift-requirements', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { store_id, requirements } = req.body;
    if (!store_id || !Array.isArray(requirements)) {
        return res.status(400).json({ error: 'store_id and requirements are required' });
    }
    try {
        const storeId = (0, storeAccess_1.requireManageableStore)(req, store_id);
        if (!storeId) {
            return res.status(400).json({ error: 'store_id is required' });
        }
        db_1.default.prepare('DELETE FROM shift_requirements WHERE store_id = ?').run(storeId);
        const insertStmt = db_1.default.prepare('INSERT INTO shift_requirements (store_id, day_of_week, time_slot_start, time_slot_end, min_employees) VALUES (?, ?, ?, ?, ?)');
        const insertMany = db_1.default.transaction((reqs) => {
            for (const requirement of reqs) {
                insertStmt.run(storeId, requirement.day_of_week, requirement.time_slot_start, requirement.time_slot_end, requirement.min_employees);
            }
        });
        insertMany(requirements);
        res.json({ message: 'Shift requirements updated successfully' });
    }
    catch (error) {
        console.error('Update shift requirements error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update shift requirements' });
    }
});
router.get('/settings', auth_1.authenticate, (req, res) => {
    try {
        const settings = db_1.default.prepare('SELECT * FROM system_settings ORDER BY setting_key')
            .all();
        res.json(settings);
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});
router.put('/settings', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
        return res.status(400).json({ error: 'Invalid request data' });
    }
    try {
        const updateStmt = db_1.default.prepare('UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?');
        const updateMany = db_1.default.transaction((sets) => {
            for (const setting of sets) {
                updateStmt.run(setting.setting_value, setting.setting_key);
            }
        });
        updateMany(settings);
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.default = router;
