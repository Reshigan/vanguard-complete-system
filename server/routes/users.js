const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/stats', userController.getStats);
router.delete('/account', userController.deleteAccount);

module.exports = router;