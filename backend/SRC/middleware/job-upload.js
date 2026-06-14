const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { getUploadPath } = require('../utils/upload-paths');

const logoDirectory = getUploadPath('logos');
fs.mkdirSync(logoDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, logoDirectory);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}${extension}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedTypes.includes(extension)) {
    return cb(new Error('Only PNG, JPG, JPEG, SVG, and WEBP logos are allowed'));
  }

  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
