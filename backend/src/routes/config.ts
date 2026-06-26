import { Router } from 'express';
import db from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { ShiftRequirement, SystemSetting } from '../models/types';
import {
  buildStoreFilter,
  getManageableStoreContext,
  parseRequestedStoreId,
  requireManageableStore,
} from '../utils/storeAccess';

const router = Router();

router.get('/shift-requirements', authenticate, (req: AuthRequest, res) => {
  try {
    let query = 'SELECT * FROM shift_requirements WHERE 1=1';
    const params: any[] = [];
    const storeId = parseRequestedStoreId(req.query.store_id);

    if (storeId && !Number.isNaN(storeId)) {
      query += ' AND store_id = ?';
      params.push(storeId);
    } else if (req.user!.role === 'admin') {
      const filter = buildStoreFilter('shift_requirements', getManageableStoreContext(req).storeIds);
      query += filter.clause;
      params.push(...filter.params);
    }

    query += ' ORDER BY store_id, day_of_week, time_slot_start';

    const requirements = db.prepare(query).all(...params) as ShiftRequirement[];
    res.json(requirements);
  } catch (error) {
    console.error('Get shift requirements error:', error);
    res.status(500).json({ error: 'Failed to get shift requirements' });
  }
});

router.put('/shift-requirements', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { store_id, requirements } = req.body;

  if (!store_id || !Array.isArray(requirements)) {
    return res.status(400).json({ error: 'store_id and requirements are required' });
  }

  try {
    const storeId = requireManageableStore(req, store_id);
    if (!storeId) {
      return res.status(400).json({ error: 'store_id is required' });
    }

    db.prepare('DELETE FROM shift_requirements WHERE store_id = ?').run(storeId);

    const insertStmt = db.prepare(
      'INSERT INTO shift_requirements (store_id, day_of_week, time_slot_start, time_slot_end, min_employees) VALUES (?, ?, ?, ?, ?)'
    );

    const insertMany = db.transaction((reqs: any[]) => {
      for (const requirement of reqs) {
        insertStmt.run(
          storeId,
          requirement.day_of_week,
          requirement.time_slot_start,
          requirement.time_slot_end,
          requirement.min_employees
        );
      }
    });

    insertMany(requirements);

    res.json({ message: 'Shift requirements updated successfully' });
  } catch (error: any) {
    console.error('Update shift requirements error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update shift requirements' });
  }
});

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
