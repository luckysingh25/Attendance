const Teacher = require('../models/Teacher');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerTeacher = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and a password of at least 4 characters' });
    }

    const existingTeacher = await Teacher.findOne({ email });
    const existingUser = await User.findOne({ email });
    
    if (existingTeacher || existingUser) {
      return res.status(400).json({ success: false, message: 'Teacher with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
    });
    
    await teacher.save();
    console.log("Teacher saved:", teacher._id);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'teacher'
    });
    
    await user.save();
    console.log("User saved:", user._id);

    const token = jwt.sign(
      { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      token,
      teacher: { id: teacher._id, name: teacher.name, email: teacher.email },
    });
  } catch (error) {
    next(error);
  }
};

exports.loginTeacher = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      token,
      teacher: { id: teacher._id, name: teacher.name, email: teacher.email },
    });
  } catch (error) {
    next(error);
  }
};
