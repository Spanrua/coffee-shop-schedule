import { Router } from 'express';
import db from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { AvailableTime } from '../models/types';
import { startOfWeek, format } from 'date-fns';

const router = Router();

// 提交可用时间
router.post('/', authenticate, (req: AuthRequest, res) => {
  const { week_start_date, available_times } = req.body;

  if (!week_start_date || !Array.isArray(available_times)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // 删除该用户该周的旧数据
    db.prepare('DELETE FROM available_times WHERE user_id = ? AND week_start_date = ?')
      .run(req.user!.userId, week_start_date);

    // 插入新数据
    const insertStmt = db.prepare(
      'INSERT INTO available_times (user_id, week_start_date, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
    );

    const insertMany = db.transaction((times: any[]) => {
      for (const time of times) {
        insertStmt.run(
          req.user!.userId,
          week_start_date,
          time.day_of_week,
          time.start_time,
          time.end_time
        );
      }
    });

    insertMany(available_times);

    res.json({ message: 'Available times submitted successfully' });
  } catch (error) {
    console.error('Submit available times error:', error);
    res.status(500).json({ error: 'Failed to submit available times' });
  }
});

// 获取我的某周可用时间
router.get('/my/:weekStart', authenticate, (req: AuthRequest, res) => {
  const { weekStart } = req.params;

  try {
    const times = db.prepare(
      'SELECT * FROM available_times WHERE user_id = ? AND week_start_date = ? ORDER BY day_of_week, start_time'
    ).all(req.user!.userId, weekStart) as AvailableTime[];

    res.json(times);
  } catch (error) {
    console.error('Get available times error:', error);
    res.status(500).json({ error: 'Failed to get available times' });
  }
});

// 获取所有员工某周可用时间（管理员）
router.get('/all/:weekStart', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { weekStart } = req.params;

  try {
    const times = db.prepare(`
      SELECT at.*, u.name as user_name, u.username
      FROM available_times at
      JOIN users u ON at.user_id = u.id
      WHERE at.week_start_date = ?
      ORDER BY at.day_of_week, at.start_time, u.name
    `).all(weekStart) as any[];

    res.json(times);
  } catch (error) {
    console.error('Get all available times error:', error);
    res.status(500).json({ error: 'Failed to get available times' });
  }
});

// 删除某周的可用时间提交
router.delete('/:weekStart', authenticate, (req: AuthRequest, res) => {
  const { weekStart } = req.params;

  try {
    db.prepare('DELETE FROM available_times WHERE user_id = ? AND week_start_date = ?')
      .run(req.user!.userId, weekStart);

    res.json({ message: 'Available times deleted successfully' });
  } catch (error) {
    console.error('Delete available times error:', error);
    res.status(500).json({ error: 'Failed to delete available times' });
  }
});

export default router;
