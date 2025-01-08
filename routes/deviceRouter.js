const Router = require('express');
const router = new Router();
const DeviceController = require('../controllers/deviceController');
const checkRole = require('../middleware/checkRoleMiddleware');
const attributeDeviceController = require('../controllers/attributeDeviceController');

router.post('/', checkRole('admin'), DeviceController.create);

router.get('/', DeviceController.getAll);
router.get('/search', DeviceController.searchItem);
router.get('/:slug', DeviceController.getBySlug);
router.get('/id/:id', DeviceController.getById);
router.post('/:deviceId/attributes/', checkRole('admin'), attributeDeviceController.createAttribute);

router.delete('/delete', checkRole('admin'), DeviceController.delete);

router.put('/:deviceId/attributes/:attributeName', checkRole('admin'), attributeDeviceController.updateAttribute);
router.put('/:id', checkRole('admin'), DeviceController.update);
//router.put('/:id/decreaseAmount', DeviceController.decreaseAmount);

module.exports = router;