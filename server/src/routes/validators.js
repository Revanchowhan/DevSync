const { body, param, query } = require('express-validator');
const { SKILL_LEVELS } = require('../models/User');

const email = body('email')
  .exists().withMessage('email is required')
  .isEmail().withMessage('email must be valid')
  .normalizeEmail();

const password = body('password')
  .exists().withMessage('password is required')
  .isLength({ min: 6 }).withMessage('password must be at least 6 characters');

const skillArray = (field = 'skills') => [
  body(field).optional().isArray().withMessage(`${field} must be an array`),
  body(`${field}.*.name`)
    .notEmpty().withMessage('skill name is required')
    .trim(),
  body(`${field}.*.level`)
    .optional()
    .isIn(SKILL_LEVELS).withMessage(`skill level must be one of ${SKILL_LEVELS.join(', ')}`),
];

const mongoIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} must be a valid id`);

const mongoIdBody = (name) =>
  body(name)
    .exists().withMessage(`${name} is required`)
    .isMongoId().withMessage(`${name} must be a valid id`);

const dateField = (name, required = true) => {
  const chain = body(name);
  if (required) chain.exists().withMessage(`${name} is required`).bail();
  else chain.optional();
  return chain.isISO8601().withMessage(`${name} must be a valid date`).toDate();
};

const optionalQueryMongoId = (name) =>
  query(name).optional().isMongoId().withMessage(`${name} must be a valid id`);

module.exports = {
  email,
  password,
  skillArray,
  mongoIdParam,
  mongoIdBody,
  dateField,
  optionalQueryMongoId,
  SKILL_LEVELS,
};
