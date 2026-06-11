import { Router } from 'express';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取我的通知列表
router.get('/', authenticate, (req: AuthRequest, res) => {
  const { unread_only } = req.query;

  try {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [req.user!.userId];

    if (unread_only === 'true') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(...params);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// 获取未读通知数量
router.get('/unread-count', authenticate, (req: AuthRequest, res) => {
  try {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user!.userId) as { count: number };

    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// 标记通知为已读
router.put('/:id/read', authenticate, (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const notification = db.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id) as any;

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'No permission' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// 标记所有通知为已读
router.put('/read-all', authenticate, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
      .run(req.user!.userId);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// 删除通知
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const notification = db.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id) as any;

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'No permission' });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// 清空已读通知
router.delete('/clear-read', authenticate, (req: AuthRequest, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ? AND is_read = 1')
      .run(req.user!.userId);

    res.json({ message: 'Read notifications cleared' });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export default router;
