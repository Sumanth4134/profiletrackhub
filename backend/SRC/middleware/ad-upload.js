const fs = require('fs');
const multer = require('multer');
const path = require('path');

const { getUploadPath } = require('../utils/upload-paths');

const uploadDir = getUploadPath('ads');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const safeBaseName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 60) || 'ad-image';

    cb(null, `${Date.now()}-${safeBaseName}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PNG, JPG, JPEG, WEBP, and GIF image files are allowed'), false);
};

module.exports = multer({ storage, fileFilter });
