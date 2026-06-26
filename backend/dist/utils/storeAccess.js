"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAdminScope = normalizeAdminScope;
exports.getStoreIdsForUser = getStoreIdsForUser;
exports.getManageableStoreContext = getManageableStoreContext;
exports.parseRequestedStoreId = parseRequestedStoreId;
exports.requireManageableStore = requireManageableStore;
exports.buildStoreFilter = buildStoreFilter;
const db_1 = __importDefault(require("../db"));
function normalizeAdminScope(role, adminScope) {
    if (role !== 'admin') {
        return 'none';
    }
    if (adminScope === 'store' || adminScope === 'super') {
        return adminScope;
    }
    return 'super';
}
function getStoreIdsForUser(userId, accessType) {
    const rows = db_1.default.prepare('SELECT store_id FROM user_store_access WHERE user_id = ? AND access_type = ? ORDER BY store_id').all(userId, accessType);
    return rows.map((row) => row.store_id);
}
function getManageableStoreContext(req) {
    const user = req.user;
    const scope = normalizeAdminScope(user.role, user.admin_scope);
    if (scope === 'super') {
        const stores = db_1.default.prepare('SELECT id FROM stores WHERE status = ? ORDER BY id')
            .all('active');
        return {
            isSuperAdmin: true,
            storeIds: stores.map((store) => store.id),
        };
    }
    return {
        isSuperAdmin: false,
        storeIds: getStoreIdsForUser(user.userId, 'manage'),
    };
}
function parseRequestedStoreId(value) {
    if (value === undefined || value === null || value === '' || value === 'all') {
        return undefined;
    }
    const storeId = Number(value);
    if (!Number.isInteger(storeId) || storeId <= 0) {
        return NaN;
    }
    return storeId;
}
function requireManageableStore(req, requestedStoreId) {
    const storeId = parseRequestedStoreId(requestedStoreId);
    if (Number.isNaN(storeId)) {
        throw Object.assign(new Error('Invalid store_id'), { statusCode: 400 });
    }
    const context = getManageableStoreContext(req);
    if (storeId === undefined) {
        if (context.isSuperAdmin) {
            return undefined;
        }
        if (context.storeIds.length === 1) {
            return context.storeIds[0];
        }
        throw Object.assign(new Error('store_id is required'), { statusCode: 400 });
    }
    if (!context.storeIds.includes(storeId)) {
        throw Object.assign(new Error('No permission for this store'), { statusCode: 403 });
    }
    return storeId;
}
function buildStoreFilter(alias, storeIds) {
    if (storeIds.length === 0) {
        return { clause: ' AND 1=0', params: [] };
    }
    return {
        clause: ` AND ${alias}.store_id IN (${storeIds.map(() => '?').join(', ')})`,
        params: storeIds,
    };
}
