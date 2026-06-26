import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initializeDatabase } from './db';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import availableTimesRoutes from './routes/availableTimes';
import shiftsRoutes from './routes/shifts';
import clockRoutes from './routes/clock';
import payrollRoutes from './routes/payroll';
import configRoutes from './routes/config';
import requestsRoutes from './routes/requests';
import notificationsRoutes from './routes/notifications';
import storesRoutes from './routes/stores';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/available-times', availableTimesRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/clock', clockRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/config', configRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stores', storesRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  咖啡店排班与打卡系统 - 后端服务                      ║
╠═══════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${config.port}            ║
║  Environment: ${config.nodeEnv}                          ║
║  Database: ${config.databasePath}  ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
