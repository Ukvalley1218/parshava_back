import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on file type
    let folder = 'general';

    if (file.fieldname === 'firmPhoto') {
      folder = 'customers/photos';
    } else if (file.fieldname === 'customerPhoto') {
      folder = 'customers/photos';
    } else if (['panCard', 'aadharCard', 'shopAct', 'msme', 'gstCertificate', 'other'].includes(file.fieldname)) {
      folder = 'customers/documents';
    }

    const uploadPath = path.join(__dirname, '../../uploads', folder);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fieldName = file.fieldname;
    cb(null, `${fieldName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
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
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Export different upload configurations
export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fields) => upload.fields(fields);
export const uploadAny = upload.any();

// Customer document upload fields
export const customerUploadFields = [
  { name: 'firmPhoto', maxCount: 1 },
  { name: 'customerPhoto', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'shopAct', maxCount: 1 },
  { name: 'msme', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'other', maxCount: 5 }
];

export default upload;