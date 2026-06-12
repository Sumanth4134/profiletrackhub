const express = require('express');

const controller = require('../controllers/public.controller');
const upload = require('../middleware/upload');

const router = express.Router();
const publicApplyUpload = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'extra_file', maxCount: 1 }
]);

function handleApplyUpload(req, res, next) {
  publicApplyUpload(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'File upload failed' });
    }

    next();
  });
}

router.get('/jobs', controller.getPublicJobs);
router.get('/job-roles', controller.getPublicJobRoles);
router.get('/ads', controller.getActiveAds);
router.get('/jobs/by-role/:roleName', controller.getPublicJobsByRole);
router.get('/jobs/by-id/:id', controller.getPublicJobById);
router.get('/jobs/:slug', controller.getPublicJobBySlug);
router.post(
  '/jobs/:slug/apply',
  handleApplyUpload,
  controller.applyToPublicJob
);

module.exports = router;
