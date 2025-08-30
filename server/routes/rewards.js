const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rewardsController = require('../controllers/rewardsController');

router.use(authenticate);

router.get('/', rewardsController.getUserRewards);
router.post('/redeem', rewardsController.redeemReward);
router.get('/leaderboard', rewardsController.getLeaderboard);

module.exports = router;