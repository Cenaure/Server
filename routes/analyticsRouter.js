const Router = require('express');
const router = new Router();
const checkRole = require('../middleware/checkRoleMiddleware');
const AnalyticsController = require('../controllers/analyticsController');

router.get('/', checkRole('admin'), AnalyticsController.getAnalytics);

module.exports = router;
