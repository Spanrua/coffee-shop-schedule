import { Router } from 'express';
import db from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { ShiftRequirement, SystemSetting } from '../models/types';

const router = Router();

// 获取班次需求配置
router.get('/shift-requirements', authenticate, (req: AuthRequest, res) => {
  try {
    const requirements = db.prepare('SELECT * FROM shift_requirements ORDER BY day_of_week, time_slot_start')
      .all() as ShiftRequirement[];

    res.json(requirements);
  } catch (error) {
    console.error('Get shift requirements error:', error);
    res.status(500).json({ error: 'Failed to get shift requirements' });
  }
});

// 更新班次需求配置（管理员）
router.put('/shift-requirements', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { requirements } = req.body;

  if (!Array.isArray(requirements)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // 删除旧配置
    db.prepare('DELETE FROM shift_requirements').run();

    // 插入新配置
    const insertStmt = db.prepare(
      'INSERT INTO shift_requirements (day_of_week, time_slot_start, time_slot_end, min_employees) VALUES (?, ?, ?, ?)'
    );

    const insertMany = db.transaction((reqs: any[]) => {
      for (const req of reqs) {
        insertStmt.run(req.day_of_week, req.time_slot_start, req.time_slot_end, req.min_employees);
      }
    });

    insertMany(requirements);

    res.json({ message: 'Shift requirements updated successfully' });
  } catch (error) {
    console.error('Update shift requirements error:', error);
    res.status(500).json({ error: 'Failed to update shift requirements' });
  }
});

// 获取系统设置
router.get('/settings', authenticate, (req: AuthRequest, res) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings ORDER BY setting_key')
      .all() as SystemSetting[];

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// 更新系统设置（管理员）
router.put('/settings', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { settings } = req.body;

  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const updateStmt = db.prepare(
      'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    );

    const updateMany = db.transaction((sets: any[]) => {
      for (const setting of sets) {
        updateStmt.run(setting.setting_value, setting.setting_key);
      }
    });

    updateMany(settings);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
