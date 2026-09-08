const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const {
  listReports,
  listMyReports,
  getReport,
  createReport,
  updateReportStatus,
  deleteReport,
  getStats,
} = require('../controllers/reportController');

const {
  requireAuth,
  optionalAuth,
} = require('../middleware/auth');

const { requireRole } = require('../middleware/role');

/* =========================================================
   IMAGE UPLOAD CONFIGURATION
   ========================================================= */

const uploadDirectory = path.join(
  __dirname,
  '..',
  '..',
  'uploads',
  'reports'
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        'Only JPG, PNG and WebP images are allowed.'
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    // Maximum image size: 5 MB
    fileSize: 5 * 1024 * 1024,
  },
});

/* =========================================================
   REPORT ROUTES
   ========================================================= */

router.get('/', optionalAuth, listReports);

router.get('/stats/summary', getStats);

router.get('/mine', requireAuth, listMyReports);

router.get('/:id', getReport);

// "evidence" must match the FormData key used by React.
router.post(
  '/',
  requireAuth,
  upload.single('evidence'),
  createReport
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('authority', 'admin'),
  updateReportStatus
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  deleteReport
);

module.exports = router;