const Session = require('../models/Session');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const crypto = require('crypto');

exports.startSession = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const teacherId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Please provide eventId' });
    }

    await Session.updateMany({ eventId, teacherId, isActive: true }, { isActive: false });

    const token = crypto.randomBytes(16).toString('hex');
    const tokenGeneratedAt = Date.now();

    const session = await Session.create({
      eventId,
      teacherId,
      currentToken: token,
      tokenGeneratedAt,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      session: {
        id: session._id,
        eventId: session.eventId,
        currentToken: session.currentToken,
        tokenGeneratedAt: session.tokenGeneratedAt,
        isActive: session.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const teacherId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Please provide sessionId' });
    }

    const session = await Session.findOne({ _id: sessionId, teacherId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found or unauthorized' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    session.currentToken = token;
    session.tokenGeneratedAt = Date.now();
    await session.save();

    res.status(200).json({
      success: true,
      token: session.currentToken,
      generatedAt: session.tokenGeneratedAt.getTime(),
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentToken = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, teacherId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    res.status(200).json({
      success: true,
      token: session.currentToken,
      generatedAt: session.tokenGeneratedAt.getTime(),
    });
  } catch (error) {
    next(error);
  }
};

exports.validateToken = async (req, res, next) => {
  try {
    const { token, eventId } = req.body;
    const studentId = req.user.id;

    if (!token || !eventId) {
      return res.status(400).json({ success: false, message: 'Please provide token and eventId' });
    }

    const session = await Session.findOne({ eventId, isActive: true }).sort({ createdAt: -1 }).populate('teacherId', 'name');
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session found for this event' });
    }

    if (session.currentToken !== token) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    const ageSec = (Date.now() - session.tokenGeneratedAt.getTime()) / 1000;
    const expirySeconds = parseInt(process.env.QR_TOKEN_EXPIRY_SECONDS) || 20;

    if (ageSec > expirySeconds) {
      return res.status(400).json({ success: false, message: 'QR expired' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const photoUrl = student.photoUrl ? `${baseUrl}${student.photoUrl}` : null;

    console.log("Token validated for:", student.erp);

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        erp: student.erp,
        photoUrl
      },
      sessionId: session._id,
      eventId: session.eventId,
      teacherName: session.teacherId.name,
    });
  } catch (error) {
    next(error);
  }
};

exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, teacherId },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or unauthorized' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
