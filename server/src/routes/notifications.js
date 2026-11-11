const express = require('express');
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('./validators');

const router = express.Router();

router.use(requireAuth);

router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.unreadCount);
router.put('/:id/read', validate([v.mongoIdParam()]), notificationController.markRead);

module.exports = router;
