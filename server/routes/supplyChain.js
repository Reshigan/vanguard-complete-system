const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supplyChainController = require('../controllers/supplyChainController');

// Public routes
router.get('/track/:tokenId', supplyChainController.trackToken);

// Protected routes
router.use(authenticate);

router.post('/events', supplyChainController.addEvent);
router.get('/analytics/:manufacturerId', authorize('manufacturer', 'distributor'), supplyChainController.getAnalytics);
router.get('/events/:tokenId', supplyChainController.getTokenEvents);

module.exports = router;