const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { reportLimiter } = require('../utils/rateLimiter');
const safetyController = require('../controllers/safetyController');

const router = express.Router();

router.post('/report', requireAuth, reportLimiter, safetyController.reportUser);
router.post('/block', requireAuth, safetyController.blockUser);
router.delete('/block/:targetUserId', requireAuth, safetyController.unblockUser);
router.get('/blocked', requireAuth, safetyController.listBlockedUsers);
router.post('/verify-email/request', requireAuth, safetyController.requestEmailVerification);
router.post('/verify-email/confirm', safetyController.confirmEmailVerification);
router.delete('/account', requireAuth, safetyController.deleteAccount);

module.exports = router;
