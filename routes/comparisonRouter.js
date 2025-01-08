const Router = require('express');
const router = new Router();
const ComparisonController = require('../controllers/comparisonController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:typeId', ComparisonController.addToComparison);
router.get('/', authMiddleware,ComparisonController.getByUserId);

module.exports = router;
