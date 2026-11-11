const express = require('express');
const { body, query } = require('express-validator');
const requestController = require('../controllers/requestController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('./validators');

const router = express.Router();

// All team-request routes are student-only.
router.use(requireAuth, requireRole('student'));

router.post(
  '/',
  validate([
    v.mongoIdBody('teamId'),
    v.mongoIdBody('toUserId'),
    body('message').optional().trim().isLength({ max: 500 }),
  ]),
  requestController.createRequest
);

router.post(
  '/join',
  validate([
    v.mongoIdBody('teamId'),
    body('message').optional().trim().isLength({ max: 500 }),
  ]),
  requestController.createJoinRequest
);

router.get(
  '/all',
  requestController.listAllRequests
);

router.get(
  '/',
  validate([
    query('tab').optional().isIn(['sent', 'received']).withMessage('tab must be sent or received'),
  ]),
  requestController.listRequests
);

router.put(
  '/:id/accept',
  validate([v.mongoIdParam()]),
  requestController.acceptRequest
);

router.put(
  '/:id/decline',
  validate([v.mongoIdParam()]),
  requestController.declineRequest
);

router.delete('/:id', validate([v.mongoIdParam()]), requestController.cancelRequest);

module.exports = router;
