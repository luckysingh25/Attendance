const express = require('express');
const router = express.Router();
const { startSession, refreshToken, getCurrentToken, validateToken, endSession } = require('../controllers/sessionController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.post('/start', protect, teacherOnly, startSession);
router.post('/refresh-token', protect, teacherOnly, refreshToken);
router.get('/current-token/:sessionId', protect, teacherOnly, getCurrentToken);
router.post('/validate', protect, validateToken);
router.patch('/end/:sessionId', protect, teacherOnly, endSession);

module.exports = router;
