const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const tokenController = require('../controllers/tokenController');

// Public routes
router.post('/validate', tokenController.validateToken);
router.get('/:tokenHash/info', tokenController.getTokenInfo);

// Protected routes
router.use(authenticate);

router.post('/invalidate', tokenController.invalidateToken);
router.get('/:id/history', tokenController.getTokenHistory);
router.post('/batch-create', authorize('manufacturer'), tokenController.createBatchTokens);
router.get('/my-tokens', tokenController.getMyTokens);

module.exports = router;