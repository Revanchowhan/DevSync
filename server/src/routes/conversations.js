const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureFlags');
const { messageLimiter } = require('../utils/rateLimiter');
const conversationController = require('../controllers/conversationController');

const router = express.Router();

// Guard all conversations behind the FEATURE_MESSAGING flag
router.use(requireFeature('messaging'));

router.get('/', requireAuth, conversationController.listConversations);
router.post('/direct', requireAuth, conversationController.getOrCreateDirectConversation);
router.post('/team/:teamId', requireAuth, conversationController.getOrCreateTeamConversation);
router.get('/unread-total', requireAuth, conversationController.getUnreadTotal);
router.get('/:id/messages', requireAuth, conversationController.getMessages);
router.post(
  '/:id/messages',
  requireAuth,
  messageLimiter,
  conversationController.sendMessage
);
router.post('/:id/read', requireAuth, conversationController.markAsRead);

module.exports = router;
