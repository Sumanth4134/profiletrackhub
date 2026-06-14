const fs = require('fs');
const multer = require('multer');
const path = require('path');

const { getUploadRoot } = require('../utils/upload-paths');

const uploadDirectory = getUploadRoot();
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PDF/DOC/DOCX files allowed'), false);
};

module.exports = multer({ storage, fileFilter });
