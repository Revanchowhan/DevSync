const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { zodValidate } = require('../middleware/zodValidate');
const { updateProfileSchema } = require('../validation/schemas');

const router = express.Router();

router.get('/me', requireAuth, userController.getMe);
router.put(
  '/me',
  requireAuth,
  zodValidate({ body: updateProfileSchema }),
  userController.updateMe
);

// Admin-only host approval queue.
router.get('/host-requests', requireAuth, requireAdmin, userController.listHostRequests);
router.post('/host-requests/:id/approve', requireAuth, requireAdmin, userController.approveHost);
router.post('/host-requests/:id/reject', requireAuth, requireAdmin, userController.rejectHost);

module.exports = router;
