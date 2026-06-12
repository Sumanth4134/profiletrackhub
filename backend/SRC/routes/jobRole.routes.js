const express = require('express');

const controller = require('../controllers/jobRole.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/', controller.getJobRoles);
router.post('/', controller.createJobRole);

module.exports = router;
