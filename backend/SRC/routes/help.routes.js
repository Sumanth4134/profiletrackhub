const express = require('express');

const controller = require('../controllers/help.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/', controller.getHelpRequests);
router.post('/', controller.createHelpRequest);
router.patch('/:id/status', controller.updateHelpRequestStatus);

module.exports = router;
