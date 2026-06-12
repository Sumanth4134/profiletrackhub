const pool = require('../config/db');
const { buildNotificationsQuery } = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '50', 10), 1), 100);
    const offset = Math.max(Number.parseInt(req.query.offset || '0', 10), 0);
    const { whereClause, values } = buildNotificationsQuery(req.user, {
      status: req.query.status,
      category: req.query.category,
      search: req.query.search
    });

    const dataResult = await pool.query(
      `SELECT
         n.*,
         actor.name AS actor_name
       FROM notifications n
       LEFT JOIN admins actor ON actor.id = n.actor_id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM notifications n
       WHERE ${whereClause}`,
      values
    );

    res.json({
      data: dataResult.rows,
      total: countResult.rows[0]?.total || 0
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { whereClause, values } = buildNotificationsQuery(req.user, { status: 'unread' });
    const result = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications n
       WHERE ${whereClause}`,
      values
    );

    res.json({ unreadCount: result.rows[0]?.unread_count || 0 });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ error: 'Failed to load unread count' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const scopeClause = req.user.role === 'super_admin' ? '' : ' AND user_id = $2';
    const values = req.user.role === 'super_admin'
      ? [req.params.id]
      : [req.params.id, req.user.id];

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1${scopeClause}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('markNotificationRead error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const scopeClause = req.user.role === 'super_admin' ? '' : 'WHERE user_id = $1';
    const values = req.user.role === 'super_admin' ? [] : [req.user.id];

    await pool.query(
      `UPDATE notifications
       SET is_read = true,
           updated_at = CURRENT_TIMESTAMP
       ${scopeClause}`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const scopeClause = req.user.role === 'super_admin' ? '' : ' AND user_id = $2';
    const values = req.user.role === 'super_admin'
      ? [req.params.id]
      : [req.params.id, req.user.id];

    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1${scopeClause}
       RETURNING id`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

exports.clearReadNotifications = async (req, res) => {
  try {
    const scopeClause = req.user.role === 'super_admin' ? '' : ' AND user_id = $1';
    const values = req.user.role === 'super_admin' ? [] : [req.user.id];

    await pool.query(
      `DELETE FROM notifications
       WHERE is_read = true${scopeClause}`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    console.error('clearReadNotifications error:', error);
    res.status(500).json({ error: 'Failed to clear read notifications' });
  }
};
