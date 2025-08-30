const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(authenticate);

// General dashboard
router.get('/stats', dashboardController.getStats);
router.get('/activity', dashboardController.getRecentActivity);

module.exports = router;