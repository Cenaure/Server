const userService = require("../service/userService");
const {validationResult} = require('express-validator');
const ApiError = require('../error/api-error');
const ResetLink = require('../models/resetLink-model');
const { ok } = require("assert");
class UserController{
    async registration(req, res, next){
        try {
            const {firstName, secondName, email, password} = req.body;

            if(!email || !password){
                return next(ApiError.badRequest('Не вказаний email або пароль'));
            }

            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return next(ApiError.badRequest('Помилка при валідації', errors.array()));
            }

            const userData = await userService.registration(firstName, secondName, email, password);
            res.cookie('refreshToken', userData.refreshToken, {
              maxAge: 30 * 24 * 60 * 60 * 1000,
              httpOnly: true,
              secure: true,
              sameSite: 'None',
            });
            
            res.cookie('accessToken', userData.accessToken, {
              maxAge: 30 * 60 * 1000,
              httpOnly: true,
              secure: true,
              sameSite: 'None',      
            });
            
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async createNewUser(req, res, next) {
        try {
            const {firstName, secondName, patronymic, email, password, phoneNumber, role, userDiscount} = req.body;
            const userData = await userService.createNewUser(firstName, secondName, patronymic, email, password, phoneNumber, role, userDiscount);
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next){
        try {
            const {email, password} = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'None',
            });
            
            res.cookie('accessToken', userData.accessToken, {
                maxAge: 30*60*1000,
                httpOnly: true,
                secure: true,
                sameSite: 'None',    
            });        

            return res.json(userData);
        } catch (error) {
            next(error);
        }
    } 

    /*async alternateLogin(req, res, next){
        try {
            const{firstName, secondName, password} = req.body;
            const userData = await userService.alternateLogin(firstName, secondName, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true});
            res.cookie('accessToken', userData.accessToken, {maxAge: 30*60*1000, httpOnly: true});

            return res.json(userData);
        } catch (error) {
            next(error);
        }
    } */

    async logout(req, res, next){
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return res.json(token);
        } catch (error) {
            next(error);
        }
    } 

    async activate(req, res, next){
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            req.app.get('io').emit('activationSucceed');
            return res.redirect(process.env.CLIENT_URL)
        } catch (error) {
            next(error);
        }
    } 

    async refresh(req, res, next){
        try {
            const {refreshToken} = req.cookies;

            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, {
              maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
              httpOnly: true,                   // Доступен только с сервера
              secure: true, // Только по HTTPS в продакшене
              sameSite: 'None',                // Разрешить кросс-доменные запросы
            });
            
            res.cookie('accessToken', userData.accessToken, {
              maxAge: 30 * 60 * 1000, // 30 минут
              httpOnly: true,
              secure: true, // Только по HTTPS в продакшене
              sameSite: 'None',       // Разрешить кросс-доменные запросы
            });
            return res.json(userData);
        } catch (error) {
            next(ApiError.internal(error.message))       
        }
    } 

    async getUsers(req, res, next){
        try {
            const limit = req.params.limit || 10;
            const page = req.params.page || 0;
            const users = await userService.getAllUsers({limit, page})
            return res.json(users)
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    } 

    async getOneUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            return res.json(user);
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async createNewActivationLink(req, res, next){
        try {
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.split(' ')[1];
            if(!accessToken) next(ApiError.UnauthorizedError())
            return res.json(await userService.createNewActivationLink(accessToken))
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async change(req, res, next){
        try {
            const {firstName, secondName, patronymic, email, phoneNumber} = req.body;
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.split(' ')[1];
            if(!accessToken) next(ApiError.UnauthorizedError())
            return res.json(await userService.updateUserInfo(accessToken, firstName, secondName, patronymic, email, phoneNumber, req))
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async update(req, res, next){
        try {
            const {id} = req.params
            const {firstName, secondName, patronymic, email, phoneNumber, role, userDiscount} = req.body;
            const response = await userService.updateUserAdmin(id, firstName, secondName, patronymic, email, phoneNumber, role, userDiscount);
            return res.json(response)
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async sendPasswordResetLink(req, res, next) {
        try {
            const {email} = req.query
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.split(' ')[1];

            if (!accessToken && !email) return next(ApiError.UnauthorizedError());

            return res.json(await userService.remindUserPassword(accessToken, email));
        } catch (error) {
            next(ApiError.internal(error.message));
        }
    }
    
    async resetPassword(req, res, next) {
        try {
            const { resetLink } = req.params;
            const { newPassword } = req.body
            const url = await ResetLink.findOne({ link: resetLink });
            if (!url) throw ApiError.badRequest('Некоректне посилання збросу пароля');
    
            const responce = await userService.resetUserPassword(resetLink, newPassword)
            return res.json(responce)
        } catch (error) {
            next(ApiError.internal(error.message));
        }
    }

    async updatePassword(req, res, next){
        try {
            const {newPassword, previousPassword} = req.body
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.split(' ')[1];
            if (!accessToken) return next(ApiError.UnauthorizedError());
            return res.json(await userService.updatePassword(accessToken, newPassword, previousPassword))
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async deleteAccount(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.split(' ')[1];
            if (!accessToken) return next(ApiError.UnauthorizedError());
            const {refreshToken} = req.cookies;
            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return res.json(await userService.deleteAccount(accessToken, refreshToken))
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async deleteUser(req, res) {
        try {
          const userId = req.params.id;
          return res.json(await userService.deleteUserById(userId));
        } catch (error) {
          res.status(500).json({ message: 'Error deleting user' });
        }
    }
}

module.exports = new UserController();