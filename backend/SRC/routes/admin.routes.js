const express = require('express');

const controller = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/dashboard', controller.getAdminDashboard);
router.get('/jobs', controller.getAdminJobs);
router.post('/jobs', controller.createJob);
router.put('/jobs/:id', controller.updateJob);
router.delete('/jobs/:id', controller.deleteJob);

router.get('/profiles', controller.getAdminProfiles);
router.get('/profiles/export-csv', controller.exportAdminProfilesCsv);
router.get('/profiles/export-excel', controller.exportAdminProfilesExcel);
router.get('/profiles/:id', controller.getAdminProfileById);
router.patch('/profiles/:id/status', controller.updateAdminProfileStatus);
router.delete('/profiles/:id', controller.deleteAdminProfile);

module.exports = router;
