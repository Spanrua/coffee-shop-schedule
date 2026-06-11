"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const db_1 = require("./db");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const availableTimes_1 = __importDefault(require("./routes/availableTimes"));
const shifts_1 = __importDefault(require("./routes/shifts"));
const clock_1 = __importDefault(require("./routes/clock"));
const payroll_1 = __importDefault(require("./routes/payroll"));
const config_2 = __importDefault(require("./routes/config"));
const requests_1 = __importDefault(require("./routes/requests"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize database
(0, db_1.initializeDatabase)();
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/available-times', availableTimes_1.default);
app.use('/api/shifts', shifts_1.default);
app.use('/api/clock', clock_1.default);
app.use('/api/payroll', payroll_1.default);
app.use('/api/config', config_2.default);
app.use('/api/requests', requests_1.default);
app.use('/api/notifications', notifications_1.default);
// Error handler
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(config_1.config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  咖啡店排班与打卡系统 - 后端服务                      ║
╠═══════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${config_1.config.port}            ║
║  Environment: ${config_1.config.nodeEnv}                          ║
║  Database: ${config_1.config.databasePath}  ║
╚═══════════════════════════════════════════════════════╝
  `);
});
exports.default = app;
