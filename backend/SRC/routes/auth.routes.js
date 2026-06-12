const express = require('express');

const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/admin-login', controller.adminLogin);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.getSession);
router.post('/change-password', requireAuth, controller.changePassword);
router.post('/request-password', controller.requestPassword);
router.put('/profile', requireAuth, controller.updateProfile);

module.exports = router;
