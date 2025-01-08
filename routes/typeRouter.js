const Router = require('express');
const router = new Router();
const typeController = require('../controllers/typeController');
const checkRole = require('../middleware/checkRoleMiddleware');
const attributeTypeController = require('../controllers/attributeTypeController');

router.post('/', checkRole('admin'), typeController.create);
router.get('/', typeController.getAll);
router.get('/:slug', typeController.getBySlug);
router.get('/id/:typeId', typeController.getOne);
router.put('/:typeId', checkRole('admin'), typeController.changeType);
router.post('/:typeId/attributes', checkRole('admin'), attributeTypeController.createAttributes);

router.delete('/:typeId/attributes/:attributeId', checkRole('admin'), attributeTypeController.deleteAttribute);
router.delete('/delete', checkRole('admin'), typeController.deleteTypes);

module.exports = router;
