const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(authenticate);

// Manufacturer dashboard
router.get('/manufacturer/overview', authorize('manufacturer'), dashboardController.getManufacturerOverview);
router.get('/manufacturer/products', authorize('manufacturer'), dashboardController.getManufacturerProducts);
router.get('/manufacturer/analytics', authorize('manufacturer'), dashboardController.getManufacturerAnalytics);

// Distributor dashboard
router.get('/distributor/overview', authorize('distributor'), dashboardController.getDistributorOverview);
router.get('/distributor/inventory', authorize('distributor'), dashboardController.getDistributorInventory);

// Admin dashboard
router.get('/admin/overview', authorize('admin'), dashboardController.getAdminOverview);
router.get('/admin/global-stats', authorize('admin'), dashboardController.getGlobalStats);

module.exports = router;