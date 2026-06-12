const express = require('express');
const router = express.Router();

const controller = require('../controllers/candidate.controller');
const upload = require('../middleware/upload');

// Debug
console.log("Controller:", controller);

// ✅ FIXED MULTI FILE UPLOAD
router.post(
  '/',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'extra_file', maxCount: 1 }
  ]),
  controller.createCandidate
);

// GET ALL
router.get('/', controller.getCandidates);

// ✅ EXPORT BEFORE :id
router.get('/export', controller.exportCSV);
router.get('/export-excel', controller.exportExcel);

// GET BY ID
router.get('/:id', controller.getCandidateById);

// UPDATE STATUS
router.patch('/:id/status', controller.updateStatus);

// DELETE
router.delete('/:id', controller.deleteCandidate);

module.exports = router;