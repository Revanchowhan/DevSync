const express = require('express');
const { body, param } = require('express-validator');
const teamController = require('../controllers/teamController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('./validators');

const router = express.Router();

// All team routes are student-only.
router.use(requireAuth, requireRole('student'));

const missingSkillsValidation = [
  body('missingSkills').optional().isArray().withMessage('missingSkills must be an array'),
  body('missingSkills')
    .optional()
    .isArray({ max: 10 }).withMessage('missingSkills cannot exceed 10 entries'),
  body('missingSkills.*.name').notEmpty().withMessage('missing skill name is required').trim(),
];

router.post(
  '/',
  validate([
    v.mongoIdBody('hackathonId'),
    body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 80 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    ...missingSkillsValidation,
  ]),
  teamController.createTeam
);

router.get(
  '/my',
  validate([v.optionalQueryMongoId('hackathonId')]),
  teamController.myTeams
);

router.get(
  '/search/candidates',
  validate([
    v.optionalQueryMongoId('hackathonId'),
    v.optionalQueryMongoId('teamId'),
  ]),
  teamController.searchCandidates
);

router.get(
  '/by-code/:code',
  validate([
    param('code').trim().notEmpty().withMessage('code is required').isLength({ min: 4, max: 12 }).withMessage('code looks invalid'),
  ]),
  teamController.getTeamByCode
);

router.get('/:id', validate([v.mongoIdParam()]), teamController.getTeam);

router.put(
  '/:id',
  validate([
    v.mongoIdParam(),
    body('name').optional().trim().notEmpty().withMessage('name cannot be empty').isLength({ max: 80 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    ...missingSkillsValidation,
  ]),
  teamController.updateTeam
);

router.post('/:id/close', validate([v.mongoIdParam()]), teamController.closeTeam);

router.post('/:id/regenerate-code', validate([v.mongoIdParam()]), teamController.regenerateJoinCode);

// Workspace & Team collaboration routes
router.get('/:id/workspace', teamController.getWorkspace);
router.post('/:id/links', teamController.addLink);
router.delete('/:id/links/:linkId', teamController.deleteLink);
router.post('/:id/tasks', teamController.createTask);
router.put('/:id/tasks/:taskId', teamController.updateTask);
router.delete('/:id/tasks/:taskId', teamController.deleteTask);
router.put('/:id/transfer', teamController.transferLeadership);
router.post('/:id/leave', teamController.leaveTeam);

router.delete('/:id', validate([v.mongoIdParam()]), teamController.deleteTeam);

module.exports = router;
