"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let db;
let usePostgres = false;
if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database');
    const dbPostgres = require('./db-postgres');
    db = dbPostgres.db;
    usePostgres = true;
}
else {
    console.log('Using SQLite database');
    const dbPath = process.env.DATABASE_PATH || './database/coffee-shop.db';
    const dbDir = path_1.default.dirname(dbPath);
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    db = new better_sqlite3_1.default(dbPath);
    db.pragma('foreign_keys = ON');
}
function sqliteColumnExists(tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
}
function sqliteAddColumnIfMissing(tableName, columnDefinition) {
    const columnName = columnDefinition.trim().split(/\s+/)[0];
    if (!sqliteColumnExists(tableName, columnName)) {
        db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`).run();
    }
}
function runSQLiteStoreMigration() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_store_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      access_type TEXT NOT NULL CHECK(access_type IN ('support', 'manage')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, store_id, access_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `);
    db.prepare("INSERT OR IGNORE INTO stores (id, name, status) VALUES (1, '安工程店', 'active')").run();
    db.prepare("INSERT OR IGNORE INTO stores (id, name, status) VALUES (2, '银湖店', 'active')").run();
    sqliteAddColumnIfMissing('users', "admin_scope TEXT DEFAULT 'none'");
    sqliteAddColumnIfMissing('users', 'primary_store_id INTEGER');
    sqliteAddColumnIfMissing('available_times', 'store_id INTEGER');
    sqliteAddColumnIfMissing('shifts', 'store_id INTEGER');
    sqliteAddColumnIfMissing('clock_records', 'store_id INTEGER');
    sqliteAddColumnIfMissing('shift_requirements', 'store_id INTEGER');
    db.prepare("UPDATE users SET admin_scope = 'super' WHERE role = 'admin' AND (admin_scope IS NULL OR admin_scope = 'none')").run();
    db.prepare('UPDATE users SET primary_store_id = 1 WHERE primary_store_id IS NULL').run();
    db.prepare('UPDATE available_times SET store_id = 1 WHERE store_id IS NULL').run();
    db.prepare('UPDATE shifts SET store_id = 1 WHERE store_id IS NULL').run();
    db.prepare(`
    UPDATE clock_records
    SET store_id = (SELECT store_id FROM shifts WHERE shifts.id = clock_records.shift_id)
    WHERE store_id IS NULL AND shift_id IS NOT NULL
  `).run();
    db.prepare('UPDATE clock_records SET store_id = 1 WHERE store_id IS NULL').run();
    db.prepare('UPDATE shift_requirements SET store_id = 1 WHERE store_id IS NULL').run();
    db.prepare(`
    INSERT OR IGNORE INTO user_store_access (user_id, store_id, access_type)
    SELECT id, 1, 'support' FROM users WHERE role = 'employee'
  `).run();
    db.prepare(`
    INSERT OR IGNORE INTO user_store_access (user_id, store_id, access_type)
    SELECT id, 1, 'manage' FROM users WHERE role = 'admin'
  `).run();
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_primary_store ON users(primary_store_id);
    CREATE INDEX IF NOT EXISTS idx_user_store_access_user ON user_store_access(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_store_access_store ON user_store_access(store_id);
    CREATE INDEX IF NOT EXISTS idx_available_times_store_week ON available_times(store_id, week_start_date);
    CREATE INDEX IF NOT EXISTS idx_shifts_store_date ON shifts(store_id, date);
    CREATE INDEX IF NOT EXISTS idx_clock_records_store_date ON clock_records(store_id, date);
    CREATE INDEX IF NOT EXISTS idx_shift_requirements_store ON shift_requirements(store_id);
  `);
}
async function initializeDatabase() {
    if (usePostgres) {
        console.log('Initializing PostgreSQL database...');
        const schemaPath = path_1.default.join(__dirname, '../database/schema-postgres.sql');
        const seedPath = path_1.default.join(__dirname, '../database/seed-postgres.sql');
        if (fs_1.default.existsSync(schemaPath)) {
            const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            await db.exec(schema);
            console.log('PostgreSQL schema initialized');
        }
        const result = await db.prepare('SELECT COUNT(*) as count FROM users').get();
        const userCount = result ? result.count : 0;
        if (userCount === 0 && fs_1.default.existsSync(seedPath)) {
            const seed = fs_1.default.readFileSync(seedPath, 'utf-8');
            await db.exec(seed);
            console.log('Seed data inserted');
        }
    }
    else {
        const schemaPath = path_1.default.join(__dirname, '../database/schema.sql');
        const seedPath = path_1.default.join(__dirname, '../database/seed.sql');
        if (fs_1.default.existsSync(schemaPath)) {
            const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            db.exec(schema);
            console.log('Database schema initialized');
        }
        runSQLiteStoreMigration();
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        if (userCount.count === 0 && fs_1.default.existsSync(seedPath)) {
            const seed = fs_1.default.readFileSync(seedPath, 'utf-8');
            db.exec(seed);
            console.log('Seed data inserted');
        }
        runSQLiteStoreMigration();
        console.log('Store migration checked');
    }
}
exports.default = db;
