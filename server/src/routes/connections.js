const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { connectionRequestLimiter } = require('../utils/rateLimiter');
const { zodValidate } = require('../middleware/zodValidate');
const { sendConnectionSchema } = require('../validation/schemas');
const connectionController = require('../controllers/connectionController');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  connectionRequestLimiter,
  zodValidate({ body: sendConnectionSchema }),
  connectionController.sendConnectionRequest
);
router.get('/', requireAuth, connectionController.listConnections);
router.put('/:id/accept', requireAuth, connectionController.acceptConnection);
router.put('/:id/decline', requireAuth, connectionController.declineConnection);
router.delete('/:id', requireAuth, connectionController.cancelOrRemoveConnection);

module.exports = router;
