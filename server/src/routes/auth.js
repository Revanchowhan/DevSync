const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { zodValidate } = require('../middleware/zodValidate');
const {
  registerStudentSchema,
  registerHostSchema,
  loginSchema,
  googleAuthSchema,
} = require('../validation/schemas');
const { loginLimiter } = require('../utils/rateLimiter');

const router = express.Router();

router.post(
  '/register/student',
  zodValidate({ body: registerStudentSchema }),
  authController.registerStudent
);

router.post(
  '/register/host',
  zodValidate({ body: registerHostSchema }),
  authController.registerHost
);

router.post(
  '/login',
  loginLimiter,
  zodValidate({ body: loginSchema }),
  authController.login
);

router.post(
  '/google',
  zodValidate({ body: googleAuthSchema }),
  authController.googleAuth
);

router.get('/me', requireAuth, authController.me);

module.exports = router;
