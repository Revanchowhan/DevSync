const express = require('express');
const { body } = require('express-validator');
const hackathonController = require('../controllers/hackathonController');
const { requireAuth, optionalAuth, requireRole, requireApprovedHost } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('./validators');

const router = express.Router();

const hackathonBody = (isCreate) => {
  const req = (name, chain) =>
    isCreate ? chain.exists().withMessage(`${name} is required`).bail() : chain.optional();
  return [
    req('title', body('title')).trim().notEmpty().withMessage('title cannot be empty'),
    req('description', body('description')).trim().notEmpty().withMessage('description cannot be empty'),
    body('bannerUrl').optional().trim(),
    v.dateField('startDate', isCreate),
    v.dateField('endDate', isCreate),
    v.dateField('registrationDeadline', isCreate),
    v.dateField('teamFormationDeadline', isCreate),
    body('mode').optional().isIn(['online', 'offline']).withMessage('mode must be online or offline'),
    body('venue').optional().trim(),
    body('prize').optional().trim(),
    body('teamSizeLimit')
      .optional()
      .isInt({ min: 1, max: 20 }).withMessage('teamSizeLimit must be between 1 and 20')
      .toInt(),
    body('requiredSkills').optional().isArray().withMessage('requiredSkills must be an array'),
    body('requiredSkills.*').optional().trim().notEmpty(),
    body('isOpen').optional().isBoolean().toBoolean(),
  ];
};

router.get('/', optionalAuth, hackathonController.listHackathons);

router.post(
  '/',
  requireAuth,
  requireApprovedHost,
  validate(hackathonBody(true)),
  hackathonController.createHackathon
);

router.get('/:id', optionalAuth, validate([v.mongoIdParam()]), hackathonController.getHackathon);

router.put(
  '/:id',
  requireAuth,
  requireApprovedHost,
  validate([v.mongoIdParam(), ...hackathonBody(false)]),
  hackathonController.updateHackathon
);

router.delete(
  '/:id',
  requireAuth,
  requireApprovedHost,
  validate([v.mongoIdParam()]),
  hackathonController.deleteHackathon
);

router.post(
  '/:id/register',
  requireAuth,
  requireRole('student'),
  validate([v.mongoIdParam()]),
  hackathonController.registerForHackathon
);

router.get(
  '/:id/participants',
  requireAuth,
  requireApprovedHost,
  validate([v.mongoIdParam()]),
  hackathonController.getParticipants
);

router.get(
  '/:id/teams',
  requireAuth,
  requireApprovedHost,
  validate([v.mongoIdParam()]),
  hackathonController.getHackathonTeams
);

router.get(
  '/:id/participants/export',
  requireAuth,
  requireApprovedHost,
  validate([v.mongoIdParam()]),
  hackathonController.exportParticipants
);

router.get(
  '/:id/announcements',
  requireAuth,
  validate([v.mongoIdParam()]),
  hackathonController.listAnnouncements
);

router.post(
  '/:id/announcements',
  requireAuth,
  requireApprovedHost,
  validate([
    v.mongoIdParam(),
    body('title').notEmpty().withMessage('title is required').trim().isLength({ max: 140 }),
    body('body').notEmpty().withMessage('body is required').trim().isLength({ max: 5000 }),
  ]),
  hackathonController.createAnnouncement
);

module.exports = router;
