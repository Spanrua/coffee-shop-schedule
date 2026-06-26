import { Router } from 'express';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Store } from '../models/types';
import { getManageableStoreContext, normalizeAdminScope } from '../utils/storeAccess';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  try {
    const scope = normalizeAdminScope(req.user!.role, req.user!.admin_scope);

    if (scope === 'super') {
      const stores = db.prepare('SELECT * FROM stores WHERE status = ? ORDER BY id')
        .all('active') as Store[];
      return res.json(stores);
    }

    if (scope === 'store') {
      const context = getManageableStoreContext(req);
      if (context.storeIds.length === 0) {
        return res.json([]);
      }

      const stores = db.prepare(`
        SELECT DISTINCT s.*
        FROM stores s
        JOIN user_store_access usa ON usa.store_id = s.id
        WHERE usa.user_id = ? AND usa.access_type = ? AND s.status = ?
        ORDER BY s.id
      `).all(req.user!.userId, 'manage', 'active') as Store[];
      return res.json(stores);
    }

    const stores = db.prepare(`
      SELECT DISTINCT s.*
      FROM stores s
      LEFT JOIN user_store_access usa ON usa.store_id = s.id AND usa.user_id = ? AND usa.access_type = 'support'
      JOIN users u ON u.id = ?
      WHERE s.status = 'active' AND (s.id = u.primary_store_id OR usa.id IS NOT NULL)
      ORDER BY s.id
    `).all(req.user!.userId, req.user!.userId) as Store[];

    res.json(stores);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to get stores' });
  }
});

export default router;
