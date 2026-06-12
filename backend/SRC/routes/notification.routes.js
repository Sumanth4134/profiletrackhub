const express = require('express');

const controller = require('../controllers/notification.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/mark-all-read', controller.markAllNotificationsRead);
router.patch('/:id/read', controller.markNotificationRead);
router.delete('/clear-read', controller.clearReadNotifications);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
