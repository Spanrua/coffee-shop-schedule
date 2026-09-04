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
const time_1 = require("../utils/time");
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
function getShiftStoreId(shiftId) {
    const shift = db_1.default.prepare('SELECT store_id FROM shifts WHERE id = ?').get(shiftId);
    return shift?.store_id;
}
router.post('/generate', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { week_start_date, store_id } = req.body;
    if (!week_start_date || !store_id) {
        return res.status(400).json({ error: 'week_start_date and store_id are required' });
    }
    try {
        const storeId = (0, storeAccess_1.requireManageableStore)(req, store_id);
        if (!storeId) {
            return res.status(400).json({ error: 'store_id is required' });
        }
        const availableTimes = db_1.default.prepare(`
      SELECT at.*, u.hourly_rate, u.name
      FROM available_times at
      JOIN users u ON at.user_id = u.id
      WHERE at.week_start_date = ? AND at.store_id = ? AND u.status = 'active' AND u.role = 'employee'
      ORDER BY at.day_of_week, at.start_time
    `).all(week_start_date, storeId);
        const requirements = db_1.default.prepare(`
      SELECT * FROM shift_requirements
      WHERE store_id = ?
      ORDER BY day_of_week, time_slot_start
    `).all(storeId);
        if (requirements.length === 0) {
            return res.status(400).json({ error: 'No shift requirements configured for this store' });
        }
        const weekStart = (0, date_fns_1.parseISO)(week_start_date);
        const weekEnd = (0, date_fns_1.addDays)(weekStart, 6);
        const existingShifts = db_1.default.prepare(`
      SELECT user_id,
        SUM((julianday(date || ' ' || end_time) - julianday(date || ' ' || start_time)) * 24) as total_hours
      FROM shifts
      WHERE store_id = ? AND date BETWEEN ? AND ? AND status != 'cancelled'
      GROUP BY user_id
    `).all(storeId, (0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'), (0, date_fns_1.format)(weekEnd, 'yyyy-MM-dd'));
        const userHours = {};
        existingShifts.forEach((shift) => {
            userHours[shift.user_id] = shift.total_hours || 0;
        });
        const generatedShifts = [];
        const warnings = [];
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = (0, date_fns_1.addDays)(weekStart, dayOffset);
            const dateStr = (0, date_fns_1.format)(currentDate, 'yyyy-MM-dd');
            const dayOfWeek = currentDate.getDay();
            const dayRequirements = requirements.filter((requirement) => requirement.day_of_week === dayOfWeek);
            for (const requirement of dayRequirements) {
                const eligibleEmployees = availableTimes.filter((availableTime) => {
                    if (availableTime.day_of_week !== dayOfWeek)
                        return false;
                    const atStart = (0, date_fns_1.parse)(availableTime.start_time, 'HH:mm', new Date());
                    const atEnd = (0, date_fns_1.parse)(availableTime.end_time, 'HH:mm', new Date());
                    const reqStart = (0, date_fns_1.parse)(requirement.time_slot_start, 'HH:mm', new Date());
                    const reqEnd = (0, date_fns_1.parse)(requirement.time_slot_end, 'HH:mm', new Date());
                    return atStart <= reqStart && atEnd >= reqEnd;
                });
                eligibleEmployees.sort((a, b) => {
                    const hoursA = userHours[a.user_id] || 0;
                    const hoursB = userHours[b.user_id] || 0;
                    return hoursA - hoursB;
                });
                const assignedCount = Math.min(requirement.min_employees, eligibleEmployees.length);
                if (assignedCount < requirement.min_employees) {
                    warnings.push(`${dateStr} ${requirement.time_slot_start}-${requirement.time_slot_end}: 需要${requirement.min_employees}人，只找到${assignedCount}人`);
                }
                for (let i = 0; i < assignedCount; i++) {
                    const employee = eligibleEmployees[i];
                    const shiftStart = (0, date_fns_1.parse)(requirement.time_slot_start, 'HH:mm', new Date());
                    const shiftEnd = (0, date_fns_1.parse)(requirement.time_slot_end, 'HH:mm', new Date());
                    const shiftHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
                    generatedShifts.push({
                        user_id: employee.user_id,
                        store_id: storeId,
                        date: dateStr,
                        start_time: requirement.time_slot_start,
                        end_time: requirement.time_slot_end,
                        status: 'scheduled',
                    });
                    userHours[employee.user_id] = (userHours[employee.user_id] || 0) + shiftHours;
                }
            }
        }
        db_1.default.prepare('DELETE FROM shifts WHERE store_id = ? AND date BETWEEN ? AND ?')
            .run(storeId, (0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'), (0, date_fns_1.format)(weekEnd, 'yyyy-MM-dd'));
        if (generatedShifts.length > 0) {
            const insertStmt = db_1.default.prepare('INSERT INTO shifts (user_id, store_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)');
            const insertMany = db_1.default.transaction((shifts) => {
                for (const shift of shifts) {
                    insertStmt.run(shift.user_id, shift.store_id, shift.date, shift.start_time, shift.end_time, shift.status);
                }
            });
            insertMany(generatedShifts);
        }
        res.json({
            message: 'Shifts generated successfully',
            shifts_count: generatedShifts.length,
            warnings: warnings.length > 0 ? warnings : undefined,
        });
    }
    catch (error) {
        console.error('Generate shifts error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to generate shifts' });
    }
});
router.get('/', auth_1.authenticate, (req, res) => {
    const { start_date, end_date, user_id } = req.query;
    try {
        let query = `
      SELECT s.*, u.name as user_name, u.username, st.name as store_name
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      JOIN stores st ON s.store_id = st.id
      WHERE 1=1
    `;
        const params = [];
        if (req.user.role === 'admin') {
            const storeId = (0, storeAccess_1.requireManageableStore)(req, req.query.store_id);
            if (storeId) {
                query += ' AND s.store_id = ?';
                params.push(storeId);
            }
            else {
                const filter = (0, storeAccess_1.buildStoreFilter)('s', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
                query += filter.clause;
                params.push(...filter.params);
            }
        }
        else {
            query += ' AND s.user_id = ?';
            params.push(req.user.userId);
            const storeId = (0, storeAccess_1.parseRequestedStoreId)(req.query.store_id);
            if (storeId && !Number.isNaN(storeId)) {
                query += ' AND s.store_id = ?';
                params.push(storeId);
            }
        }
        if (start_date) {
            query += ' AND s.date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND s.date <= ?';
            params.push(end_date);
        }
        if (user_id) {
            query += ' AND s.user_id = ?';
            params.push(user_id);
        }
        query += ' ORDER BY s.date, s.start_time, u.name';
        const shifts = db_1.default.prepare(query).all(...params);
        res.json(shifts);
    }
    catch (error) {
        console.error('Get shifts error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get shifts' });
    }
});
router.get('/my', auth_1.authenticate, (req, res) => {
    const { start_date, end_date } = req.query;
    const storeId = (0, storeAccess_1.parseRequestedStoreId)(req.query.store_id);
    try {
        let query = `
      SELECT s.*, st.name as store_name
      FROM shifts s
      JOIN stores st ON s.store_id = st.id
      WHERE s.user_id = ?
    `;
        const params = [req.user.userId];
        if (storeId && !Number.isNaN(storeId)) {
            query += ' AND s.store_id = ?';
            params.push(storeId);
        }
        if (start_date) {
            query += ' AND s.date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND s.date <= ?';
            params.push(end_date);
        }
        query += ' ORDER BY s.date, s.start_time';
        const shifts = db_1.default.prepare(query).all(...params);
        res.json(shifts);
    }
    catch (error) {
        console.error('Get my shifts error:', error);
        res.status(500).json({ error: 'Failed to get shifts' });
    }
});
router.get('/today', auth_1.authenticate, (req, res) => {
    const today = (0, time_1.getChinaToday)();
    try {
        let query = `
      SELECT s.*, u.name as user_name, u.username, st.name as store_name
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      JOIN stores st ON s.store_id = st.id
      WHERE s.date = ?
    `;
        const params = [today];
        if (req.user.role === 'admin') {
            const storeId = (0, storeAccess_1.requireManageableStore)(req, req.query.store_id);
            if (storeId) {
                query += ' AND s.store_id = ?';
                params.push(storeId);
            }
            else {
                const filter = (0, storeAccess_1.buildStoreFilter)('s', (0, storeAccess_1.getManageableStoreContext)(req).storeIds);
                query += filter.clause;
                params.push(...filter.params);
            }
        }
        else {
            query += ' AND s.user_id = ?';
            params.push(req.user.userId);
        }
        query += ' ORDER BY s.start_time, u.name';
        const shifts = db_1.default.prepare(query).all(...params);
        res.json(shifts);
    }
    catch (error) {
        console.error('Get today shifts error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to get today shifts' });
    }
});
router.post('/', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { user_id, store_id, date, start_time, end_time, notes } = req.body;
    if (!user_id || !store_id || !date || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const storeId = (0, storeAccess_1.requireManageableStore)(req, store_id);
        if (!storeId) {
            return res.status(400).json({ error: 'store_id is required' });
        }
        if (!userCanWorkStore(Number(user_id), storeId)) {
            return res.status(400).json({ error: 'Employee cannot work in this store' });
        }
        const result = db_1.default.prepare('INSERT INTO shifts (user_id, store_id, date, start_time, end_time, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(user_id, storeId, date, start_time, end_time, notes || null, 'scheduled');
        const shift = db_1.default.prepare(`
      SELECT s.*, st.name as store_name
      FROM shifts s
      JOIN stores st ON s.store_id = st.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);
        res.status(201).json(shift);
    }
    catch (error) {
        console.error('Create shift error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create shift' });
    }
});
router.put('/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    const { user_id, store_id, date, start_time, end_time, status, notes } = req.body;
    const shiftId = Number(id);
    try {
        const currentStoreId = getShiftStoreId(shiftId);
        if (!currentStoreId) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        (0, storeAccess_1.requireManageableStore)(req, currentStoreId);
        const nextStoreId = store_id !== undefined ? (0, storeAccess_1.requireManageableStore)(req, store_id) : currentStoreId;
        if (user_id !== undefined && nextStoreId && !userCanWorkStore(Number(user_id), nextStoreId)) {
            return res.status(400).json({ error: 'Employee cannot work in this store' });
        }
        let query = 'UPDATE shifts SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (user_id !== undefined) {
            query += ', user_id = ?';
            params.push(user_id);
        }
        if (nextStoreId !== currentStoreId) {
            query += ', store_id = ?';
            params.push(nextStoreId);
        }
        if (date !== undefined) {
            query += ', date = ?';
            params.push(date);
        }
        if (start_time !== undefined) {
            query += ', start_time = ?';
            params.push(start_time);
        }
        if (end_time !== undefined) {
            query += ', end_time = ?';
            params.push(end_time);
        }
        if (status !== undefined) {
            query += ', status = ?';
            params.push(status);
        }
        if (notes !== undefined) {
            query += ', notes = ?';
            params.push(notes);
        }
        query += ' WHERE id = ?';
        params.push(shiftId);
        db_1.default.prepare(query).run(...params);
        const updatedShift = db_1.default.prepare(`
      SELECT s.*, st.name as store_name
      FROM shifts s
      JOIN stores st ON s.store_id = st.id
      WHERE s.id = ?
    `).get(shiftId);
        res.json(updatedShift);
    }
    catch (error) {
        console.error('Update shift error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update shift' });
    }
});
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    try {
        const storeId = getShiftStoreId(Number(id));
        if (!storeId) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        (0, storeAccess_1.requireManageableStore)(req, storeId);
        const result = db_1.default.prepare('DELETE FROM shifts WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        res.json({ message: 'Shift deleted successfully' });
    }
    catch (error) {
        console.error('Delete shift error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete shift' });
    }
});
exports.default = router;
