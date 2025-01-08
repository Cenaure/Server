const Router = require('express');
const router = new Router();
const OrderController = require('../controllers/orderController');
const checkRole = require('../middleware/checkRoleMiddleware');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', OrderController.create);
router.get('/', checkRole("admin"), OrderController.getAll);
router.get('/count', checkRole("admin"), OrderController.getCount);
router.get('/orders', authMiddleware, orderController.getOrders)
router.post('/resetCounter', checkRole("admin"),OrderController.resetCounter);
router.put('/:id', checkRole("admin"), OrderController.update);
router.patch('/:id/status', checkRole("admin"), OrderController.updateStatus);

module.exports = router;
