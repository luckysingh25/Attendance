const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

exports.loginStudent = async (req, res, next) => {
  try {
    const { erp, dob } = req.body;

    if (!erp || !dob) {
      return res.status(400).json({ success: false, message: 'Please provide ERP and DOB' });
    }

    let student = await Student.findOne({ erp });

    if (!student) {
      return res.status(401).json({ success: false, message: 'Student not found in database. Cannot login.' });
    }

    if (student.dob !== dob) {
      return res.status(401).json({ success: false, message: 'Invalid ERP or date of birth' });
    }

    const token = jwt.sign(
      { id: student._id, erp: student.erp, name: student.name, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const baseUrl = req.protocol + '://' + req.get('host');
    const photoUrl = student.photoUrl ? `${baseUrl}${student.photoUrl}` : null;

    res.status(200).json({
      success: true,
      token,
      student: {
        id: student._id,
        erp: student.erp,
        name: student.name,
        course: student.course,
        section: student.section,
        dob: student.dob,
        photoUrl: photoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { erp } = req.body;
    if (!erp) {
      return res.status(400).json({ success: false, message: 'ERP is required' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const student = await Student.findOneAndUpdate(
      { erp },
      { photoUrl },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    res.status(200).json({
      success: true,
      photoUrl: `${baseUrl}${photoUrl}`,
    });
  } catch (error) {
    next(error);
  }
};
