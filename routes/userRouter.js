const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const rateLimit = require("express-rate-limit");
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1,
    message: "Ви занадто багато разів намагалися зробити запит. Будь ласка, зачекайте хвилину."
});

//post
router.post('/registration', userController.registration);
router.post('/newUser', checkRoleMiddleware("admin"), userController.createNewUser);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/regenerateActivationLink', apiLimiter, userController.createNewActivationLink);
router.post('/reset-password/:resetLink', userController.resetPassword);

//put
router.put('/', userController.change);
router.put('/update/:id', checkRoleMiddleware("admin"), userController.update);
router.put('/password', userController.updatePassword);

//get
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/users', checkRoleMiddleware("admin"), userController.getUsers);
router.get('/users/:id', checkRoleMiddleware("admin"), userController.getOneUser);
router.get('/sendResetPasswordLink', userController.sendPasswordResetLink);

//delete
router.delete('/users/:id', checkRoleMiddleware("admin"), userController.deleteUser);
router.delete('/', userController.deleteAccount);

module.exports = router;