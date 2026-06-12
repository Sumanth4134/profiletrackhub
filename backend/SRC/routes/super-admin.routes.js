const express = require('express');

const adUpload = require('../middleware/ad-upload');
const controller = require('../controllers/superAdmin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function handleAdUpload(req, res, next) {
  adUpload.single('imageFile')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'Image upload failed' });
    }

    next();
  });
}

router.use(requireAuth, requireRole('super_admin'));

router.get('/dashboard', controller.getDashboard);
router.get('/admins', controller.getAdmins);
router.post('/admins', controller.createAdmin);
router.put('/admins/:id', controller.updateAdmin);
router.post('/admins/:id/reset-password', controller.resetPassword);
router.get('/ads', controller.getAds);
router.post('/ads', handleAdUpload, controller.createAd);
router.delete('/ads/:id', controller.deleteAd);
router.get('/jobs', controller.getJobs);
router.get('/profiles', controller.getProfiles);
router.delete('/profiles/:id', controller.deleteProfile);
router.get('/password-requests', controller.getPasswordRequests);
router.put('/password-requests/:id/resolve', controller.resolvePasswordRequest);

module.exports = router;
