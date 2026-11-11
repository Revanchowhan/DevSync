const express = require('express');
const { requireAuth } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/', requireAuth, studentController.discoverStudents);

module.exports = router;
