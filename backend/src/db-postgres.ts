import pkg from 'pg';
const { Pool } = pkg;

// 创建 PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 将占位符从 ? 转换为 $1, $2, ...
function convertPlaceholders(sql: string, params: any[]): { sql: string; params: any[] } {
  let index = 1;
  const convertedSql = sql.replace(/\?/g, () => `$${index++}`);
  return { sql: convertedSql, params };
}

// 适配器：模拟 better-sqlite3 的 API
export const db = {
  prepare: (sql: string) => ({
    run: async (...params: any[]) => {
      const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
      const result = await pool.query(convertedSql, convertedParams);
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: result.rows[0]?.id || 0
      };
    },
    get: async (...params: any[]) => {
      const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
      const result = await pool.query(convertedSql, convertedParams);
      return result.rows[0] || null;
    },
    all: async (...params: any[]) => {
      const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
      const result = await pool.query(convertedSql, convertedParams);
      return result.rows;
    },
  }),
  exec: async (sql: string) => {
    await pool.query(sql);
  },
};

export default db;
