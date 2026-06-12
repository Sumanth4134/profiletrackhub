const express = require('express');

const controller = require('../controllers/job.controller');
const upload = require('../middleware/job-upload');

const router = express.Router();

router.get('/jobs/public', controller.getPublicJobs);
router.get('/jobs/:id', controller.getJobById);

router.get('/admin/jobs', controller.getAdminJobs);
router.post('/admin/jobs', upload.single('logo'), controller.createJob);
router.put('/admin/jobs/:id', upload.single('logo'), controller.updateJob);
router.delete('/admin/jobs/:id', controller.deleteJob);

module.exports = router;
