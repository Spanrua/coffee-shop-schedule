import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 根据环境变量选择数据库
let db: any;
let usePostgres = false;

if (process.env.DATABASE_URL) {
  // 使用 PostgreSQL
  console.log('Using PostgreSQL database');
  const dbPostgres = require('./db-postgres');
  db = dbPostgres.db;
  usePostgres = true;
} else {
  // 使用 SQLite
  console.log('Using SQLite database');
  const dbPath = process.env.DATABASE_PATH || './database/coffee-shop.db';
  const dbDir = path.dirname(dbPath);

  // 确保数据库目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // 启用外键约束
  db.pragma('foreign_keys = ON');
}

// 初始化数据库
export async function initializeDatabase() {
  if (usePostgres) {
    // PostgreSQL 初始化
    console.log('Initializing PostgreSQL database...');
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    const seedPath = path.join(__dirname, '../database/seed-postgres.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await db.exec(schema);
      console.log('✓ PostgreSQL schema initialized');
    }

    // 检查是否已有数据
    const result = await db.prepare('SELECT COUNT(*) as count FROM users').get();
    const userCount = result ? result.count : 0;

    if (userCount === 0 && fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf-8');
      await db.exec(seed);
      console.log('✓ Seed data inserted');
    }
  } else {
    // SQLite 初始化
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const seedPath = path.join(__dirname, '../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schema);
      console.log('✓ Database schema initialized');
    }

    // 检查是否已有数据
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0 && fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf-8');
      db.exec(seed);
      console.log('✓ Seed data inserted');
    }
  }
}

export default db;
