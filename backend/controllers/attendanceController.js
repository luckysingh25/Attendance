const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

exports.markAttendance = async (req, res, next) => {
  try {
    const { sessionId, eventId } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !eventId) {
      return res.status(400).json({ success: false, message: 'Please provide sessionId and eventId' });
    }

    const session = await Session.findOne({ _id: sessionId, eventId, isActive: true }).populate('teacherId');
    if (!session) {
      return res.status(400).json({ success: false, message: 'Session is no longer active' });
    }

    const existingAttendance = await Attendance.findOne({ studentId, eventId });
    if (existingAttendance) {
      return res.status(400).json({ success: false, message: 'Already checked in' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const now = new Date();
    const date = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const attendance = await Attendance.create({
      studentId,
      erp: student.erp,
      studentName: student.name,
      eventId,
      sessionId,
      teacherId: session.teacherId._id,
      verifiedBy: session.teacherId.name,
      timestamp: now,
      date,
      time,
    });
    console.log("Attendance created:", student.erp);

    res.status(201).json({
      success: true,
      log: {
        id: attendance._id,
        studentName: attendance.studentName,
        erp: attendance.erp,
        eventId: attendance.eventId,
        date: attendance.date,
        time: attendance.time,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already checked in for this event' });
    }
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const logs = await Attendance.find({ studentId }).sort({ timestamp: -1 });

    const formattedLogs = logs.map(log => ({
      id: log._id,
      studentName: log.studentName,
      erp: log.erp,
      eventId: log.eventId,
      date: log.date,
      time: log.time,
      timestamp: log.timestamp,
    }));

    res.status(200).json({
      success: true,
      logs: formattedLogs,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllLogs = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    
    let query = {};
    if (eventId) {
      query.eventId = eventId;
    }

    const logs = await Attendance.find(query).sort({ timestamp: -1 }).populate('studentId', 'course section photoUrl');

    const baseUrl = req.protocol + '://' + req.get('host');
    
    const formattedLogs = logs.map(log => {
      const student = log.studentId || {};
      const photoUrl = student.photoUrl ? `${baseUrl}${student.photoUrl}` : null;
      
      return {
        id: log._id,
        studentName: log.studentName,
        erp: log.erp,
        eventId: log.eventId,
        course: student.course || 'Unknown',
        section: student.section || 'N/A',
        date: log.date,
        time: log.time,
        verifiedBy: log.verifiedBy,
        photoUrl,
        timestamp: log.timestamp,
      };
    });

    res.status(200).json({
      success: true,
      logs: formattedLogs,
    });
  } catch (error) {
    next(error);
  }
};
