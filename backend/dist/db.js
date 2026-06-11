"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 根据环境变量选择数据库
let db;
let usePostgres = false;
if (process.env.DATABASE_URL) {
    // 使用 PostgreSQL
    console.log('Using PostgreSQL database');
    const dbPostgres = require('./db-postgres');
    db = dbPostgres.db;
    usePostgres = true;
}
else {
    // 使用 SQLite
    console.log('Using SQLite database');
    const dbPath = process.env.DATABASE_PATH || './database/coffee-shop.db';
    const dbDir = path_1.default.dirname(dbPath);
    // 确保数据库目录存在
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    db = new better_sqlite3_1.default(dbPath);
    // 启用外键约束
    db.pragma('foreign_keys = ON');
}
// 初始化数据库
async function initializeDatabase() {
    if (usePostgres) {
        // PostgreSQL 初始化
        console.log('Initializing PostgreSQL database...');
        const schemaPath = path_1.default.join(__dirname, '../database/schema-postgres.sql');
        const seedPath = path_1.default.join(__dirname, '../database/seed-postgres.sql');
        if (fs_1.default.existsSync(schemaPath)) {
            const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            await db.exec(schema);
            console.log('✓ PostgreSQL schema initialized');
        }
        // 检查是否已有数据
        const result = await db.prepare('SELECT COUNT(*) as count FROM users').get();
        const userCount = result ? result.count : 0;
        if (userCount === 0 && fs_1.default.existsSync(seedPath)) {
            const seed = fs_1.default.readFileSync(seedPath, 'utf-8');
            await db.exec(seed);
            console.log('✓ Seed data inserted');
        }
    }
    else {
        // SQLite 初始化
        const schemaPath = path_1.default.join(__dirname, '../database/schema.sql');
        const seedPath = path_1.default.join(__dirname, '../database/seed.sql');
        if (fs_1.default.existsSync(schemaPath)) {
            const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            db.exec(schema);
            console.log('✓ Database schema initialized');
        }
        // 检查是否已有数据
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        if (userCount.count === 0 && fs_1.default.existsSync(seedPath)) {
            const seed = fs_1.default.readFileSync(seedPath, 'utf-8');
            db.exec(seed);
            console.log('✓ Seed data inserted');
        }
    }
}
exports.default = db;
