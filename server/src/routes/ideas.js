const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureFlags');
const { zodValidate } = require('../middleware/zodValidate');
const {
  createIdeaSchema,
  expressInterestSchema,
  decideInterestSchema,
} = require('../validation/schemas');
const ideaController = require('../controllers/ideaController');

const router = express.Router();

// Guard all idea routes with the FEATURE_IDEAS flag
router.use(requireFeature('ideas'));

router.post(
  '/',
  requireAuth,
  zodValidate({ body: createIdeaSchema }),
  ideaController.createIdea
);
router.get('/', requireAuth, ideaController.listIdeas);
router.get('/:id', requireAuth, ideaController.getIdea);
router.put('/:id/close', requireAuth, ideaController.closeIdea);
router.post(
  '/:id/interest',
  requireAuth,
  zodValidate({ body: expressInterestSchema }),
  ideaController.expressInterest
);
router.put(
  '/:id/interest/:applicantId',
  requireAuth,
  zodValidate({ body: decideInterestSchema }),
  ideaController.decideInterest
);
router.post('/:id/convert', requireAuth, ideaController.convertIdeaToTeam);

module.exports = router;
