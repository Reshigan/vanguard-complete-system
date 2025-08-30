const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rewardsController = require('../controllers/rewardsController');

router.use(authenticate);

router.get('/balance', rewardsController.getBalance);
router.get('/history', rewardsController.getHistory);
router.post('/redeem', rewardsController.redeemRewards);
router.get('/available', rewardsController.getAvailableRewards);

module.exports = router;