import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadBasePath = path.join(__dirname, '../../uploads');
const requiredDirs = [
  path.join(uploadBasePath, 'general'),
  path.join(uploadBasePath, 'customers/photos'),
  path.join(uploadBasePath, 'customers/documents'),
  path.join(uploadBasePath, 'products/images')
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const router = express.Router();

// Get folder path based on field name
const getFolderPath = (fieldname) => {
  if (fieldname === 'firmPhoto' || fieldname === 'customerPhoto') {
    return 'customers/photos';
  } else if (fieldname === 'productImage') {
    return 'products/images';
  } else if (['panCard', 'aadharCard', 'shopAct', 'msme', 'gstCertificate', 'other'].includes(fieldname)) {
    return 'customers/documents';
  }
  return 'general';
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getFolderPath(file.fieldname);
    const uploadPath = path.join(__dirname, '../../uploads', folder);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter - Allow common image types and PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = /jpeg|jpg|png|gif|webp|pdf/.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and PDF files are allowed'), false);
  }
};

// Upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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
      // Handle multer errors specifically
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 5MB limit'
        });
      }
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

    const folder = getFolderPath(req.params.field);
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
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 5MB limit'
        });
      }
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
      const folder = getFolderPath(fieldName);

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