const express = require('express');

const controller = require('../controllers/superAdmin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.patch('/:id/role', requireAuth, requireRole('super_admin'), controller.updateAdminRole);

module.exports = router;
