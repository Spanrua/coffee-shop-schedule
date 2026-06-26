"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const storeAccess_1 = require("../utils/storeAccess");
const router = (0, express_1.Router)();
function normalizeStoreIds(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return Array.from(new Set(value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)));
}
function replaceStoreAccess(userId, accessType, storeIds) {
    db_1.default.prepare('DELETE FROM user_store_access WHERE user_id = ? AND access_type = ?').run(userId, accessType);
    const insert = db_1.default.prepare('INSERT OR IGNORE INTO user_store_access (user_id, store_id, access_type) VALUES (?, ?, ?)');
    for (const storeId of storeIds) {
        insert.run(userId, storeId, accessType);
    }
}
function hydrateUsers(rows) {
    const supportRows = db_1.default.prepare(`
    SELECT user_id, store_id FROM user_store_access WHERE access_type = 'support'
  `).all();
    const manageRows = db_1.default.prepare(`
    SELECT user_id, store_id FROM user_store_access WHERE access_type = 'manage'
  `).all();
    return rows.map((user) => ({
        ...user,
        admin_scope: (0, storeAccess_1.normalizeAdminScope)(user.role, user.admin_scope),
        support_store_ids: supportRows.filter((row) => row.user_id === user.id).map((row) => row.store_id),
        managed_store_ids: manageRows.filter((row) => row.user_id === user.id).map((row) => row.store_id),
    }));
}
router.get('/', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    try {
        const context = (0, storeAccess_1.getManageableStoreContext)(req);
        let query = `
      SELECT DISTINCT u.id, u.username, u.name, u.role, u.admin_scope, u.primary_store_id,
             ps.name as primary_store_name, u.hourly_rate, u.status, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN stores ps ON u.primary_store_id = ps.id
      LEFT JOIN user_store_access usa ON usa.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (!context.isSuperAdmin) {
            const filter = (0, storeAccess_1.buildStoreFilter)('usa', context.storeIds);
            query += filter.clause;
            params.push(...filter.params);
        }
        query += ' ORDER BY u.id';
        const users = db_1.default.prepare(query).all(...params);
        res.json(hydrateUsers(users));
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});
router.post('/', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    const { username, password, name, role, admin_scope, primary_store_id, support_store_ids, managed_store_ids, hourly_rate, } = req.body;
    if (!username || !password || !name || !role || !primary_store_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['employee', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    const normalizedAdminScope = (0, storeAccess_1.normalizeAdminScope)(role, admin_scope);
    const supportStores = normalizeStoreIds(support_store_ids);
    const managedStores = normalizeStoreIds(managed_store_ids);
    const primaryStoreId = Number(primary_store_id);
    if (!supportStores.includes(primaryStoreId)) {
        supportStores.unshift(primaryStoreId);
    }
    if (role === 'admin' && normalizedAdminScope === 'store' && !managedStores.includes(primaryStoreId)) {
        managedStores.unshift(primaryStoreId);
    }
    try {
        const context = (0, storeAccess_1.getManageableStoreContext)(req);
        if (!context.isSuperAdmin && !context.storeIds.includes(primaryStoreId)) {
            return res.status(403).json({ error: 'No permission for this store' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const result = db_1.default.prepare('INSERT INTO users (username, password_hash, name, role, admin_scope, primary_store_id, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?)').run(username, passwordHash, name, role, normalizedAdminScope, primaryStoreId, hourly_rate || 50.0);
        const userId = Number(result.lastInsertRowid);
        replaceStoreAccess(userId, 'support', supportStores);
        replaceStoreAccess(userId, 'manage', normalizedAdminScope === 'super' ? context.storeIds : managedStores);
        res.status(201).json({
            id: userId,
            username,
            name,
            role,
            admin_scope: normalizedAdminScope,
            primary_store_id: primaryStoreId,
            support_store_ids: supportStores,
            managed_store_ids: normalizedAdminScope === 'super' ? context.storeIds : managedStores,
            hourly_rate: hourly_rate || 50.0,
        });
    }
    catch (error) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
router.put('/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, role, admin_scope, primary_store_id, support_store_ids, managed_store_ids, hourly_rate, status, password } = req.body;
    const userId = Number(id);
    try {
        const user = db_1.default.prepare('SELECT id, role, primary_store_id FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const context = (0, storeAccess_1.getManageableStoreContext)(req);
        const targetPrimaryStoreId = primary_store_id !== undefined ? Number(primary_store_id) : user.primary_store_id;
        if (!context.isSuperAdmin && targetPrimaryStoreId && !context.storeIds.includes(targetPrimaryStoreId)) {
            return res.status(403).json({ error: 'No permission for this store' });
        }
        let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        if (name !== undefined) {
            query += ', name = ?';
            params.push(name);
        }
        if (role !== undefined) {
            if (!['employee', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            query += ', role = ?';
            params.push(role);
        }
        if (admin_scope !== undefined) {
            const normalized = (0, storeAccess_1.normalizeAdminScope)(role || user.role, admin_scope);
            query += ', admin_scope = ?';
            params.push(normalized);
        }
        if (primary_store_id !== undefined) {
            query += ', primary_store_id = ?';
            params.push(Number(primary_store_id));
        }
        if (hourly_rate !== undefined) {
            query += ', hourly_rate = ?';
            params.push(hourly_rate);
        }
        if (status !== undefined) {
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            query += ', status = ?';
            params.push(status);
        }
        if (password !== undefined && password !== '') {
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            query += ', password_hash = ?';
            params.push(passwordHash);
        }
        query += ' WHERE id = ?';
        params.push(userId);
        db_1.default.prepare(query).run(...params);
        const updated = db_1.default.prepare('SELECT id, role, admin_scope, primary_store_id FROM users WHERE id = ?')
            .get(userId);
        const supportStores = normalizeStoreIds(support_store_ids);
        const managedStores = normalizeStoreIds(managed_store_ids);
        const primaryStoreId = updated.primary_store_id;
        if (support_store_ids !== undefined && primaryStoreId && !supportStores.includes(primaryStoreId)) {
            supportStores.unshift(primaryStoreId);
        }
        if (support_store_ids !== undefined) {
            replaceStoreAccess(userId, 'support', supportStores);
        }
        if (managed_store_ids !== undefined || admin_scope !== undefined || role !== undefined) {
            const scope = (0, storeAccess_1.normalizeAdminScope)(updated.role, updated.admin_scope);
            if (scope === 'super') {
                replaceStoreAccess(userId, 'manage', context.storeIds);
            }
            else if (scope === 'store') {
                if (primaryStoreId && !managedStores.includes(primaryStoreId)) {
                    managedStores.unshift(primaryStoreId);
                }
                replaceStoreAccess(userId, 'manage', managedStores);
            }
            else {
                replaceStoreAccess(userId, 'manage', []);
            }
        }
        const updatedUser = db_1.default.prepare(`
      SELECT u.id, u.username, u.name, u.role, u.admin_scope, u.primary_store_id,
             ps.name as primary_store_name, u.hourly_rate, u.status, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN stores ps ON u.primary_store_id = ps.id
      WHERE u.id = ?
    `).get(userId);
        res.json(hydrateUsers([updatedUser])[0]);
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    try {
        const result = db_1.default.prepare('DELETE FROM users WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
