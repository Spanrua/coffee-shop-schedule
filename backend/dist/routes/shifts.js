"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
// 自动生成排班（管理员）
router.post('/generate', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { week_start_date } = req.body;
    if (!week_start_date) {
        return res.status(400).json({ error: 'week_start_date is required' });
    }
    try {
        // 1. 获取该周所有员工的可用时间
        const availableTimes = db_1.default.prepare(`
      SELECT at.*, u.hourly_rate, u.name
      FROM available_times at
      JOIN users u ON at.user_id = u.id
      WHERE at.week_start_date = ? AND u.status = 'active' AND u.role = 'employee'
      ORDER BY at.day_of_week, at.start_time
    `).all(week_start_date);
        // 2. 获取班次需求配置
        const requirements = db_1.default.prepare('SELECT * FROM shift_requirements ORDER BY day_of_week, time_slot_start')
            .all();
        if (requirements.length === 0) {
            return res.status(400).json({ error: 'No shift requirements configured' });
        }
        // 3. 计算每个员工本周已有的排班工时（用于公平分配）
        const weekStart = (0, date_fns_1.parseISO)(week_start_date);
        const weekEnd = (0, date_fns_1.addDays)(weekStart, 6);
        const existingShifts = db_1.default.prepare(`
      SELECT user_id,
        SUM((julianday(date || ' ' || end_time) - julianday(date || ' ' || start_time)) * 24) as total_hours
      FROM shifts
      WHERE date BETWEEN ? AND ? AND status != 'cancelled'
      GROUP BY user_id
    `).all((0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'), (0, date_fns_1.format)(weekEnd, 'yyyy-MM-dd'));
        const userHours = {};
        existingShifts.forEach((s) => {
            userHours[s.user_id] = s.total_hours || 0;
        });
        // 4. 为每一天的每个时间槽分配员工
        const generatedShifts = [];
        const warnings = [];
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = (0, date_fns_1.addDays)(weekStart, dayOffset);
            const dateStr = (0, date_fns_1.format)(currentDate, 'yyyy-MM-dd');
            const dayOfWeek = currentDate.getDay();
            // 获取这一天的班次需求
            const dayRequirements = requirements.filter(r => r.day_of_week === dayOfWeek);
            for (const requirement of dayRequirements) {
                // 找出可以在这个时段工作的员工
                const eligibleEmployees = availableTimes.filter(at => {
                    if (at.day_of_week !== dayOfWeek)
                        return false;
                    // 检查可用时间是否覆盖班次时间
                    const atStart = (0, date_fns_1.parse)(at.start_time, 'HH:mm', new Date());
                    const atEnd = (0, date_fns_1.parse)(at.end_time, 'HH:mm', new Date());
                    const reqStart = (0, date_fns_1.parse)(requirement.time_slot_start, 'HH:mm', new Date());
                    const reqEnd = (0, date_fns_1.parse)(requirement.time_slot_end, 'HH:mm', new Date());
                    return atStart <= reqStart && atEnd >= reqEnd;
                });
                // 按当前工时排序（工时少的优先）
                eligibleEmployees.sort((a, b) => {
                    const hoursA = userHours[a.user_id] || 0;
                    const hoursB = userHours[b.user_id] || 0;
                    return hoursA - hoursB;
                });
                // 分配员工
                const assignedCount = Math.min(requirement.min_employees, eligibleEmployees.length);
                if (assignedCount < requirement.min_employees) {
                    warnings.push(`${dateStr} ${requirement.time_slot_start}-${requirement.time_slot_end}: 需要${requirement.min_employees}人，只找到${assignedCount}人`);
                }
                for (let i = 0; i < assignedCount; i++) {
                    const employee = eligibleEmployees[i];
                    // 计算这个班次的工时
                    const shiftStart = (0, date_fns_1.parse)(requirement.time_slot_start, 'HH:mm', new Date());
                    const shiftEnd = (0, date_fns_1.parse)(requirement.time_slot_end, 'HH:mm', new Date());
                    const shiftHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
                    generatedShifts.push({
                        user_id: employee.user_id,
                        date: dateStr,
                        start_time: requirement.time_slot_start,
                        end_time: requirement.time_slot_end,
                        status: 'scheduled',
                    });
                    // 更新工时计数
                    userHours[employee.user_id] = (userHours[employee.user_id] || 0) + shiftHours;
                }
            }
        }
        // 5. 删除该周已有的排班（如果有）
        db_1.default.prepare('DELETE FROM shifts WHERE date BETWEEN ? AND ?')
            .run((0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'), (0, date_fns_1.format)(weekEnd, 'yyyy-MM-dd'));
        // 6. 批量插入新排班
        if (generatedShifts.length > 0) {
            const insertStmt = db_1.default.prepare('INSERT INTO shifts (user_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)');
            const insertMany = db_1.default.transaction((shifts) => {
                for (const shift of shifts) {
                    insertStmt.run(shift.user_id, shift.date, shift.start_time, shift.end_time, shift.status);
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
        res.status(500).json({ error: 'Failed to generate shifts' });
    }
});
// 查询排班
router.get('/', auth_1.authenticate, (req, res) => {
    const { start_date, end_date, user_id } = req.query;
    try {
        let query = `
      SELECT s.*, u.name as user_name, u.username
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
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
        res.status(500).json({ error: 'Failed to get shifts' });
    }
});
// 获取我的排班
router.get('/my', auth_1.authenticate, (req, res) => {
    const { start_date, end_date } = req.query;
    try {
        let query = 'SELECT * FROM shifts WHERE user_id = ?';
        const params = [req.user.userId];
        if (start_date) {
            query += ' AND date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND date <= ?';
            params.push(end_date);
        }
        query += ' ORDER BY date, start_time';
        const shifts = db_1.default.prepare(query).all(...params);
        res.json(shifts);
    }
    catch (error) {
        console.error('Get my shifts error:', error);
        res.status(500).json({ error: 'Failed to get shifts' });
    }
});
// 获取今日排班
router.get('/today', auth_1.authenticate, (req, res) => {
    const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
    try {
        const shifts = db_1.default.prepare(`
      SELECT s.*, u.name as user_name, u.username
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.date = ?
      ORDER BY s.start_time, u.name
    `).all(today);
        res.json(shifts);
    }
    catch (error) {
        console.error('Get today shifts error:', error);
        res.status(500).json({ error: 'Failed to get today shifts' });
    }
});
// 手动创建班次（管理员）
router.post('/', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { user_id, date, start_time, end_time, notes } = req.body;
    if (!user_id || !date || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const result = db_1.default.prepare('INSERT INTO shifts (user_id, date, start_time, end_time, notes, status) VALUES (?, ?, ?, ?, ?, ?)').run(user_id, date, start_time, end_time, notes || null, 'scheduled');
        const shift = db_1.default.prepare('SELECT * FROM shifts WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(shift);
    }
    catch (error) {
        console.error('Create shift error:', error);
        res.status(500).json({ error: 'Failed to create shift' });
    }
});
// 更新班次（管理员）
router.put('/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    const { user_id, date, start_time, end_time, status, notes } = req.body;
    try {
        const shift = db_1.default.prepare('SELECT id FROM shifts WHERE id = ?').get(id);
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        let query = 'UPDATE shifts SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (user_id !== undefined) {
            query += ', user_id = ?';
            params.push(user_id);
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
        params.push(id);
        db_1.default.prepare(query).run(...params);
        const updatedShift = db_1.default.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
        res.json(updatedShift);
    }
    catch (error) {
        console.error('Update shift error:', error);
        res.status(500).json({ error: 'Failed to update shift' });
    }
});
// 删除班次（管理员）
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    try {
        const result = db_1.default.prepare('DELETE FROM shifts WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        res.json({ message: 'Shift deleted successfully' });
    }
    catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: 'Failed to delete shift' });
    }
});
exports.default = router;
