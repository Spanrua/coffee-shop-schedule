"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 创建请假/调班申请
router.post('/', auth_1.authenticate, (req, res) => {
    const { shift_id, request_type, reason, new_start_time, new_end_time } = req.body;
    if (!shift_id || !request_type) {
        return res.status(400).json({ error: 'shift_id and request_type are required' });
    }
    if (!['swap', 'leave', 'modify'].includes(request_type)) {
        return res.status(400).json({ error: 'Invalid request_type' });
    }
    try {
        // 检查班次是否存在且属于该用户
        const shift = db_1.default.prepare('SELECT * FROM shifts WHERE id = ? AND user_id = ?')
            .get(shift_id, req.user.userId);
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found or not yours' });
        }
        // 检查是否已有待处理的申请
        const existing = db_1.default.prepare('SELECT id FROM shift_change_requests WHERE shift_id = ? AND status = ?').get(shift_id, 'pending');
        if (existing) {
            return res.status(400).json({ error: '该班次已有待处理的申请' });
        }
        // 创建申请
        const result = db_1.default.prepare(`
      INSERT INTO shift_change_requests
      (requester_id, shift_id, request_type, reason, new_start_time, new_end_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(req.user.userId, shift_id, request_type, reason || null, new_start_time || null, new_end_time || null);
        // 获取所有管理员
        const admins = db_1.default.prepare('SELECT id FROM users WHERE role = ?').all('admin');
        // 通知所有管理员
        const notificationStmt = db_1.default.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const typeMap = {
            leave: '请假',
            swap: '调班',
            modify: '修改班次'
        };
        const typeText = typeMap[request_type] || '请假';
        for (const admin of admins) {
            notificationStmt.run(admin.id, `新的${typeText}申请`, `${req.user.name} 提交了${typeText}申请，请及时处理`, 'request', result.lastInsertRowid, 'shift_change_request');
        }
        res.status(201).json({
            id: result.lastInsertRowid,
            message: '申请已提交，等待管理员审批'
        });
    }
    catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});
// 获取我的申请列表
router.get('/my', auth_1.authenticate, (req, res) => {
    try {
        const requests = db_1.default.prepare(`
      SELECT
        scr.*,
        s.date, s.start_time, s.end_time,
        u.name as admin_name
      FROM shift_change_requests scr
      JOIN shifts s ON scr.shift_id = s.id
      LEFT JOIN users u ON scr.admin_id = u.id
      WHERE scr.requester_id = ?
      ORDER BY scr.created_at DESC
    `).all(req.user.userId);
        res.json(requests);
    }
    catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
});
// 获取所有申请（管理员）
router.get('/all', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { status } = req.query;
    try {
        let query = `
      SELECT
        scr.*,
        s.date, s.start_time, s.end_time,
        u.name as requester_name, u.username as requester_username,
        admin.name as admin_name
      FROM shift_change_requests scr
      JOIN shifts s ON scr.shift_id = s.id
      JOIN users u ON scr.requester_id = u.id
      LEFT JOIN users admin ON scr.admin_id = admin.id
      WHERE 1=1
    `;
        const params = [];
        if (status) {
            query += ' AND scr.status = ?';
            params.push(status);
        }
        query += ' ORDER BY scr.created_at DESC';
        const requests = db_1.default.prepare(query).all(...params);
        res.json(requests);
    }
    catch (error) {
        console.error('Get all requests error:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
});
// 审批申请（管理员）
router.post('/:id/approve', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;
    try {
        // 获取申请详情
        const request = db_1.default.prepare(`
      SELECT scr.*, s.user_id, s.date, s.start_time, s.end_time
      FROM shift_change_requests scr
      JOIN shifts s ON scr.shift_id = s.id
      WHERE scr.id = ?
    `).get(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: '该申请已处理' });
        }
        const transaction = db_1.default.transaction(() => {
            // 更新申请状态
            db_1.default.prepare(`
        UPDATE shift_change_requests
        SET status = 'approved', admin_id = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.userId, admin_notes || null, id);
            // 根据申请类型处理班次
            if (request.request_type === 'leave') {
                // 请假：取消班次
                db_1.default.prepare('UPDATE shifts SET status = ?, notes = ? WHERE id = ?')
                    .run('cancelled', `请假（${request.reason || ''}）`, request.shift_id);
            }
            else if (request.request_type === 'modify') {
                // 修改班次时间
                db_1.default.prepare('UPDATE shifts SET start_time = ?, end_time = ? WHERE id = ?')
                    .run(request.new_start_time, request.new_end_time, request.shift_id);
            }
            // swap 需要前端提供更多信息，暂时不自动处理
            // 通知申请人
            db_1.default.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(request.requester_id, '申请已批准', `您的${request.request_type === 'leave' ? '请假' : request.request_type === 'modify' ? '调整班次' : '调班'}申请已被批准`, 'approval', id, 'shift_change_request');
        });
        transaction();
        res.json({ message: '申请已批准' });
    }
    catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});
// 拒绝申请（管理员）
router.post('/:id/reject', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;
    try {
        // 获取申请详情
        const request = db_1.default.prepare('SELECT * FROM shift_change_requests WHERE id = ?').get(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: '该申请已处理' });
        }
        const transaction = db_1.default.transaction(() => {
            // 更新申请状态
            db_1.default.prepare(`
        UPDATE shift_change_requests
        SET status = 'rejected', admin_id = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.userId, admin_notes || null, id);
            // 通知申请人
            db_1.default.prepare(`
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(request.requester_id, '申请被拒绝', `您的申请被拒绝${admin_notes ? '：' + admin_notes : ''}`, 'approval', id, 'shift_change_request');
        });
        transaction();
        res.json({ message: '申请已拒绝' });
    }
    catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
});
// 删除申请
router.delete('/:id', auth_1.authenticate, (req, res) => {
    const { id } = req.params;
    try {
        const request = db_1.default.prepare('SELECT * FROM shift_change_requests WHERE id = ?').get(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        // 只能删除自己的且状态为pending的申请
        if (request.requester_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No permission' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: '只能删除待处理的申请' });
        }
        db_1.default.prepare('DELETE FROM shift_change_requests WHERE id = ?').run(id);
        res.json({ message: 'Request deleted' });
    }
    catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});
exports.default = router;
