const express = require('express');
const router = express.Router();

const controller = require('../controllers/candidate.controller');
const upload = require('../middleware/upload');

router.post(
  '/',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'extra_file', maxCount: 1 }
  ]),
  controller.createCandidate
);

router.get('/', controller.getCandidates);
router.get('/export', controller.exportCSV);
router.get('/export-excel', controller.exportExcel);
router.get('/:id', controller.getCandidateById);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.deleteCandidate);

module.exports = router;
