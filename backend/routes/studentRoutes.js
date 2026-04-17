const express = require('express');
const router = express.Router();
const { loginStudent, uploadPhoto } = require('../controllers/studentController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const erp = req.body.erp;
    if (!erp) {
      return cb(new Error('ERP is missing in the request'));
    }
    cb(null, erp + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

router.post('/login', loginStudent);
router.post('/upload-photo', protect, teacherOnly, upload.single('photo'), uploadPhoto);

module.exports = router;
