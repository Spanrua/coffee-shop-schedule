"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
// 创建 PostgreSQL 连接池
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// 将占位符从 ? 转换为 $1, $2, ...
function convertPlaceholders(sql, params) {
    let index = 1;
    const convertedSql = sql.replace(/\?/g, () => `$${index++}`);
    return { sql: convertedSql, params };
}
// 适配器：模拟 better-sqlite3 的 API
exports.db = {
    prepare: (sql) => ({
        run: async (...params) => {
            const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
            const result = await pool.query(convertedSql, convertedParams);
            return {
                changes: result.rowCount || 0,
                lastInsertRowid: result.rows[0]?.id || 0
            };
        },
        get: async (...params) => {
            const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
            const result = await pool.query(convertedSql, convertedParams);
            return result.rows[0] || null;
        },
        all: async (...params) => {
            const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
            const result = await pool.query(convertedSql, convertedParams);
            return result.rows;
        },
    }),
    exec: async (sql) => {
        await pool.query(sql);
    },
};
exports.default = exports.db;
