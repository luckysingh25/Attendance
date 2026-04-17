const express = require('express');
const router = express.Router();
const { markAttendance, getHistory, getAllLogs } = require('../controllers/attendanceController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.post('/mark', protect, markAttendance);
router.get('/history', protect, getHistory);
router.get('/all', protect, teacherOnly, getAllLogs);

module.exports = router;
