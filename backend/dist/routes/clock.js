"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const date_fns_1 = require("date-fns");
const storeAccess_1 = require("../utils/storeAccess");
const router = (0, express_1.Router)();
// 上班打卡
router.post('/in', auth_1.authenticate, (req, res) => {
    const { shift_id } = req.body;
    const now = new Date();
    const today = (0, date_fns_1.format)(now, 'yyyy-MM-dd');
    const clockInTime = now.toISOString();
    try {
        // 检查是否已经打过卡
        if (shift_id) {
            const existing = db_1.default.prepare('SELECT id FROM clock_records WHERE shift_id = ? AND clock_in_time IS NOT NULL').get(shift_id);
            if (existing) {
                return res.status(400).json({ error: 'Already clocked in for this shift' });
            }
        }
        // 检查异常：打卡时间与排班时间的差距
        let isAnomaly = false;
        let shift = null;
        if (shift_id) {
            shift = db_1.default.prepare('SELECT * FROM shifts WHERE id = ?').get(shift_id);
            if (shift) {
                const shiftStart = (0, date_fns_1.parseISO)(`${shift.date}T${shift.start_time}`);
                const minutesDiff = Math.abs((0, date_fns_1.differenceInMinutes)(now, shiftStart));
                // 超过2小时（120分钟）标记为异常
                if (minutesDiff > 120) {
                    isAnomaly = true;
                }
            }
        }
        else {
            // 没有关联班次也标记为异常
            isAnomaly = true;
        }
        // 插入打卡记录
        const result = db_1.default.prepare(`
      INSERT INTO clock_records (shift_id, user_id, store_id, date, clock_in_time, is_anomaly)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(shift_id || null, req.user.userId, shift?.store_id || null, today, clockInTime, isAnomaly ? 1 : 0);
        const record = db_1.default.prepare('SELECT * FROM clock_records WHERE id = ?')
            .get(result.lastInsertRowid);
        res.json(record);
    }
    catch (error) {
        console.error('Clock in error:', error);
        res.status(500).json({ error: 'Failed to clock in' });
    }
});
// 下班打卡
router.post('/out', auth_1.authenticate, (req, res) => {
    const { shift_id, clock_record_id } = req.body;
    const now = new Date();
    const clockOutTime = now.toISOString();
    try {
        let record;
        // 查找打卡记录
        if (clock_record_id) {
            record = db_1.default.prepare('SELECT * FROM clock_records WHERE id = ? AND user_id = ?').get(clock_record_id, req.user.userId);
        }
        else if (shift_id) {
            record = db_1.default.prepare('SELECT * FROM clock_records WHERE shift_id = ? AND user_id = ? AND clock_out_time IS NULL ORDER BY id DESC LIMIT 1').get(shift_id, req.user.userId);
        }
        else {
            // 找最近的未下班打卡记录
            record = db_1.default.prepare('SELECT * FROM clock_records WHERE user_id = ? AND clock_out_time IS NULL ORDER BY id DESC LIMIT 1').get(req.user.userId);
        }
        if (!record) {
            return res.status(404).json({ error: 'No clock-in record found' });
        }
        if (record.clock_out_time) {
            return res.status(400).json({ error: 'Already clocked out' });
        }
        // 检查异常
        let isAnomaly = record.is_anomaly;
        if (record.shift_id) {
            const shift = db_1.default.prepare('SELECT * FROM shifts WHERE id = ?').get(record.shift_id);
            if (shift) {
                const shiftEnd = (0, date_fns_1.parseISO)(`${shift.date}T${shift.end_time}`);
                const minutesDiff = Math.abs((0, date_fns_1.differenceInMinutes)(now, shiftEnd));
                if (minutesDiff > 120) {
                    isAnomaly = true;
                }
            }
        }
        // 更新打卡记录
        db_1.default.prepare(`
      UPDATE clock_records
      SET clock_out_time = ?, is_anomaly = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(clockOutTime, isAnomaly ? 1 : 0, record.id);
        const updatedRecord = db_1.default.prepare('SELECT * FROM clock_records WHERE id = ?')
            .get(record.id);
        res.json(updatedRecord);
    }
    catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ error: 'Failed to clock out' });
    }
});
// 获取今日打卡记录
router.get('/today', auth_1.authenticate, (req, res) => {
    const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
    try {
        let query = `
      SELECT cr.*, s.start_time as shift_start, s.end_time as shift_end, u.name as user_name, st.name as store_name
      FROM clock_records cr
      LEFT JOIN shifts s ON cr.shift_id = s.id
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN stores st ON cr.store_id = st.id
      WHERE cr.date = ?
    `;
        const params = [today];
        if (req.user.role === 'admin') {
            const storeId = (0, storeAccess_1.requireManageableStore)(req, req.query.store_id);
            if (storeId) {
                query += ' AND cr.store_id = ?';
                params.push(storeId);
            }
            else {
                const filter = (0, storeAccess_1.buildStoreFilter)('cr', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
                query += filter.clause;
                params.push(...filter.params);
            }
        }
        else {
            query += ' AND cr.user_id = ?';
            params.push(req.user.userId);
        }
        query += ' ORDER BY cr.clock_in_time DESC';
        const records = db_1.default.prepare(query).all(...params);
        res.json(records);
    }
    catch (error) {
        console.error('Get today records error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get today records' });
    }
});
// 获取我的打卡历史
router.get('/my', auth_1.authenticate, (req, res) => {
    const { start_date, end_date } = req.query;
    try {
        let query = `
      SELECT cr.*, s.start_time as shift_start, s.end_time as shift_end
      FROM clock_records cr
      LEFT JOIN shifts s ON cr.shift_id = s.id
      WHERE cr.user_id = ?
    `;
        const params = [req.user.userId];
        if (start_date) {
            query += ' AND cr.date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND cr.date <= ?';
            params.push(end_date);
        }
        query += ' ORDER BY cr.date DESC, cr.clock_in_time DESC';
        const records = db_1.default.prepare(query).all(...params);
        res.json(records);
    }
    catch (error) {
        console.error('Get my records error:', error);
        res.status(500).json({ error: 'Failed to get records' });
    }
});
// 获取所有打卡记录（管理员）
router.get('/records', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { start_date, end_date, user_id } = req.query;
    try {
        let query = `
      SELECT cr.*, s.start_time as shift_start, s.end_time as shift_end, u.name as user_name, u.username,
             st.name as store_name
      FROM clock_records cr
      LEFT JOIN shifts s ON cr.shift_id = s.id
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN stores st ON cr.store_id = st.id
      WHERE 1=1
    `;
        const params = [];
        if (start_date) {
            query += ' AND cr.date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND cr.date <= ?';
            params.push(end_date);
        }
        if (user_id) {
            query += ' AND cr.user_id = ?';
            params.push(user_id);
        }
        const storeId = (0, storeAccess_1.requireManageableStore)(req, req.query.store_id);
        if (storeId) {
            query += ' AND cr.store_id = ?';
            params.push(storeId);
        }
        else {
            const filter = (0, storeAccess_1.buildStoreFilter)('cr', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
            query += filter.clause;
            params.push(...filter.params);
        }
        query += ' ORDER BY cr.date DESC, cr.clock_in_time DESC';
        const records = db_1.default.prepare(query).all(...params);
        res.json(records);
    }
    catch (error) {
        console.error('Get records error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get records' });
    }
});
// 修改/补录打卡记录（管理员）
router.put('/records/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    const { clock_in_time, clock_out_time, is_anomaly, admin_approved, notes } = req.body;
    try {
        const record = db_1.default.prepare('SELECT id, store_id FROM clock_records WHERE id = ?').get(id);
        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }
        if (record.store_id) {
            (0, storeAccess_1.requireManageableStore)(req, record.store_id);
        }
        let query = 'UPDATE clock_records SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (clock_in_time !== undefined) {
            query += ', clock_in_time = ?';
            params.push(clock_in_time);
        }
        if (clock_out_time !== undefined) {
            query += ', clock_out_time = ?';
            params.push(clock_out_time);
        }
        if (is_anomaly !== undefined) {
            query += ', is_anomaly = ?';
            params.push(is_anomaly ? 1 : 0);
        }
        if (admin_approved !== undefined) {
            query += ', admin_approved = ?';
            params.push(admin_approved ? 1 : 0);
        }
        if (notes !== undefined) {
            query += ', notes = ?';
            params.push(notes);
        }
        query += ' WHERE id = ?';
        params.push(id);
        db_1.default.prepare(query).run(...params);
        const updatedRecord = db_1.default.prepare('SELECT * FROM clock_records WHERE id = ?')
            .get(id);
        res.json(updatedRecord);
    }
    catch (error) {
        console.error('Update record error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update record' });
    }
});
// 获取当前在岗人员
router.get('/on-duty', auth_1.authenticate, (req, res) => {
    const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
    try {
        let query = `
      SELECT cr.*, u.name as user_name, u.username, s.start_time as shift_start, s.end_time as shift_end,
             st.name as store_name
      FROM clock_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN shifts s ON cr.shift_id = s.id
      LEFT JOIN stores st ON cr.store_id = st.id
      WHERE cr.date = ? AND cr.clock_in_time IS NOT NULL AND cr.clock_out_time IS NULL
    `;
        const params = [today];
        if (req.user.role === 'admin') {
            const storeId = (0, storeAccess_1.requireManageableStore)(req, req.query.store_id);
            if (storeId) {
                query += ' AND cr.store_id = ?';
                params.push(storeId);
            }
            else {
                const filter = (0, storeAccess_1.buildStoreFilter)('cr', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
                query += filter.clause;
                params.push(...filter.params);
            }
        }
        else {
            query += ' AND cr.user_id = ?';
            params.push(req.user.userId);
        }
        query += ' ORDER BY cr.clock_in_time';
        const onDuty = db_1.default.prepare(query).all(...params);
        res.json(onDuty);
    }
    catch (error) {
        console.error('Get on-duty error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get on-duty staff' });
    }
});
exports.default = router;
