import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';

    if (file.fieldname === 'firmPhoto' || file.fieldname === 'customerPhoto') {
      folder = 'customers/photos';
    } else if (['panCard', 'aadharCard', 'shopAct', 'msme', 'gstCertificate', 'other'].includes(file.fieldname)) {
      folder = 'customers/documents';
    }

    const uploadPath = path.join(__dirname, '../../uploads', folder);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png, and .pdf files are allowed'), false);
  }
};

// Upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Customer document upload fields
const customerUploadFields = [
  { name: 'firmPhoto', maxCount: 1 },
  { name: 'customerPhoto', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'shopAct', maxCount: 1 },
  { name: 'msme', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'other', maxCount: 5 }
];

// @route   POST /api/upload/single/:field
// @desc    Upload a single file
// @access  Private
router.post('/single/:field', protect, (req, res) => {
  upload.single(req.params.field)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Determine folder for URL
    let folder = 'general';
    if (['firmPhoto', 'customerPhoto'].includes(req.params.field)) {
      folder = 'customers/photos';
    } else {
      folder = 'customers/documents';
    }

    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  });
});

// @route   POST /api/upload/customer
// @desc    Upload customer documents (photos and documents)
// @access  Private
router.post('/customer', protect, (req, res) => {
  upload.fields(customerUploadFields)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process uploaded files
    const uploadedFiles = {};
    Object.keys(req.files).forEach(fieldName => {
      const folder = ['firmPhoto', 'customerPhoto'].includes(fieldName)
        ? 'customers/photos'
        : 'customers/documents';

      uploadedFiles[fieldName] = req.files[fieldName].map(file => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${folder}/${file.filename}`
      }));
    });

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadedFiles
    });
  });
});

export default router;