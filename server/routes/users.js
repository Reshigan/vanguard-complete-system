const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/consumption-tracker', userController.getConsumptionTracker);
router.post('/consumption-tracker', userController.addConsumptionEntry);

// Admin routes
router.get('/all', authorize('admin'), userController.getAllUsers);
router.put('/:id/role', authorize('admin'), userController.updateUserRole);

module.exports = router;