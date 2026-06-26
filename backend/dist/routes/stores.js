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
router.get('/', auth_1.authenticate, (req, res) => {
    try {
        const scope = (0, storeAccess_1.normalizeAdminScope)(req.user.role, req.user.admin_scope);
        if (scope === 'super') {
            const stores = db_1.default.prepare('SELECT * FROM stores WHERE status = ? ORDER BY id')
                .all('active');
            return res.json(stores);
        }
        if (scope === 'store') {
            const context = (0, storeAccess_1.getManageableStoreContext)(req);
            if (context.storeIds.length === 0) {
                return res.json([]);
            }
            const stores = db_1.default.prepare(`
        SELECT DISTINCT s.*
        FROM stores s
        JOIN user_store_access usa ON usa.store_id = s.id
        WHERE usa.user_id = ? AND usa.access_type = ? AND s.status = ?
        ORDER BY s.id
      `).all(req.user.userId, 'manage', 'active');
            return res.json(stores);
        }
        const stores = db_1.default.prepare(`
      SELECT DISTINCT s.*
      FROM stores s
      LEFT JOIN user_store_access usa ON usa.store_id = s.id AND usa.user_id = ? AND usa.access_type = 'support'
      JOIN users u ON u.id = ?
      WHERE s.status = 'active' AND (s.id = u.primary_store_id OR usa.id IS NOT NULL)
      ORDER BY s.id
    `).all(req.user.userId, req.user.userId);
        res.json(stores);
    }
    catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Failed to get stores' });
    }
});
exports.default = router;
