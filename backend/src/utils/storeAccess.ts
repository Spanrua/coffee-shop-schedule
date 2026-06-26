import db from '../db';
import { AuthRequest } from '../middleware/auth';

export type AdminScope = 'none' | 'store' | 'super';
export type StoreAccessType = 'support' | 'manage';

export interface StoreAccessContext {
  isSuperAdmin: boolean;
  storeIds: number[];
}

export function normalizeAdminScope(role: string, adminScope?: string | null): AdminScope {
  if (role !== 'admin') {
    return 'none';
  }
  if (adminScope === 'store' || adminScope === 'super') {
    return adminScope;
  }
  return 'super';
}

export function getStoreIdsForUser(userId: number, accessType: StoreAccessType): number[] {
  const rows = db.prepare(
    'SELECT store_id FROM user_store_access WHERE user_id = ? AND access_type = ? ORDER BY store_id'
  ).all(userId, accessType) as Array<{ store_id: number }>;

  return rows.map((row) => row.store_id);
}

export function getManageableStoreContext(req: AuthRequest): StoreAccessContext {
  const user = req.user!;
  const scope = normalizeAdminScope(user.role, user.admin_scope);

  if (scope === 'super') {
    const stores = db.prepare('SELECT id FROM stores WHERE status = ? ORDER BY id')
      .all('active') as Array<{ id: number }>;
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

export function parseRequestedStoreId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return undefined;
  }

  const storeId = Number(value);
  if (!Number.isInteger(storeId) || storeId <= 0) {
    return NaN;
  }

  return storeId;
}

export function requireManageableStore(req: AuthRequest, requestedStoreId: unknown): number | undefined {
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

export function buildStoreFilter(alias: string, storeIds: number[]): { clause: string; params: number[] } {
  if (storeIds.length === 0) {
    return { clause: ' AND 1=0', params: [] };
  }

  return {
    clause: ` AND ${alias}.store_id IN (${storeIds.map(() => '?').join(', ')})`,
    params: storeIds,
  };
}
