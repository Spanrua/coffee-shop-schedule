import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  databasePath: process.env.DATABASE_PATH || './database/coffee-shop.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
