const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Student = require('./models/Student'); // For seeding
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Configure uploads directory and make it static
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Attendance API running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const seedStudents = async () => {
  try {
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      const demoStudents = [
        { erp: '20241001', name: 'Aman Verma', dob: '2003-06-12', course: 'B.Tech CSE', section: 'A' },
        { erp: '20241002', name: 'Neha Singh', dob: '2003-09-25', course: 'B.Tech IT', section: 'B' },
        { erp: '20241003', name: 'Rahul Mehta', dob: '2004-01-18', course: 'BCA', section: 'A' },
        { erp: '20241004', name: 'Simran Kaur', dob: '2003-12-02', course: 'B.Tech ECE', section: 'C' },
        { erp: '20241005', name: 'Arjun Nair', dob: '2003-04-09', course: 'B.Tech CSE', section: 'A' },
        { erp: '20241006', name: 'Pooja Yadav', dob: '2003-07-14', course: 'BBA', section: 'B' },
        { erp: '20241007', name: 'Karan Patel', dob: '2004-02-21', course: 'BCA', section: 'A' },
        { erp: '20241008', name: 'Riya Das', dob: '2003-10-30', course: 'B.Tech IT', section: 'C' }
      ];
      await Student.insertMany(demoStudents);
      
      for (const student of demoStudents) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(student.dob, salt); // Password is DOB by default
        
        const user = new User({
          name: student.name,
          email: `${student.erp}@student.edu`,
          password: hashedPassword,
          role: 'student'
        });
        await user.save().catch(e => console.log('Seed user skip:', e.message));
      }

      console.log('Seeded exact dataset of 8 demo students into both collections.');
    }
  } catch (error) {
    console.error('Error seeding students:', error);
  }
};

const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  await seedStudents();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});
