const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mailService');
const tokenService = require('./tokenService')
const UserDto = require('../dtos/userDto');
const ApiError = require('../error/api-error');
const ResetLink = require('../models/resetLink-model');
const Cart = require('../models/cart-model');

class UserService {
    async generateAndSaveTokens(user) {
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken, tokens.accessToken);
        return {...tokens, user: userDto};
    }

    async registration(firstName, secondName, email, password, role) {
        const candidate = await UserModel.findOne({email});
        if(candidate) throw ApiError.badRequest(`Користувач з поштою ${email} вже існує`);
        
        const hashPassword = await bcrypt.hash(password, 10);
        const activationLink = uuid.v4();

        const user = await UserModel.create({firstName, secondName, email, password: hashPassword, role, activationLink})
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/user/activate/${activationLink}`);

        return this.generateAndSaveTokens(user);
    }

    async createNewUser(firstName, secondName, patronymic, email, password, phoneNumber, role, userDiscount) {
        const candidate = await UserModel.findOne({email});
        if(candidate) throw ApiError.badRequest(`Користувач з поштою ${email} вже існує`);
        
        const hashPassword = await bcrypt.hash(password, 10);
        //const activationLink = uuid.v4();

        const user = await UserModel.create({firstName, secondName, patronymic, email, password: hashPassword, phoneNumber, role, userDiscount})
        //await mailService.sendActivationMail(email, `${process.env.API_URL}/api/user/activate/${activationLink}`);

        return this.generateAndSaveTokens(user);
    }

    async activate(activationLink){
        const user = await UserModel.findOne({activationLink})
        if(!user) throw ApiError.badRequest('Неккоректне посилання активації')
        
        user.isActivated = true;
        await user.save();
    }

    async login(email, password){
        const user = await UserModel.findOne({email})
        if(!user) throw ApiError.internal('Вказана пошта чи пароль неправильні')
        
        const isPassEquals = await bcrypt.compare(password, user.password);
        if(!isPassEquals) throw ApiError.badRequest('Вказана пошта чи пароль неправильні');
        
        return this.generateAndSaveTokens(user);
    }

    async alternateLogin(firstName, secondName, password){
        const user = await UserModel.findOne({firstName, secondName})
        if(!user) throw ApiError.badRequest('Користувача з такими даними не існує')
        
        const isPassEquals = await bcrypt.compare(password, user.password);
        if(!isPassEquals) throw ApiError.badRequest('Вказана пошта чи пароль неправильні');
    
        return this.generateAndSaveTokens(user);
    }

    async logout(refreshToken){
        const token = await tokenService.removeToken(refreshToken); 
        return token;
    }

    async refresh(refreshToken){
        if(!refreshToken) throw ApiError.UnauthorizedError();

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = tokenService.findToken(refreshToken);
        if(!userData || !tokenFromDb) throw ApiError.UnauthorizedError();
        
        const user = await UserModel.findById(userData.id);

        return this.generateAndSaveTokens(user);
    }

    async getAllUsers({limit, page}){
        const users = await UserModel.find().limit(limit).skip(limit * page).exec(); 
        const totalCount = await UserModel.countDocuments();
        return [users, totalCount];
    }

    async getUserById(id){
        const user = await UserModel.findById(id);
        return user;
    }

    async createNewActivationLink(token) {
        const userData = tokenService.validateAccessToken(token);
        if (!userData) throw ApiError.UnauthorizedError();

        const user = await UserModel.findById(userData.id);
        if (!user) throw ApiError.badRequest(`Користувача не знайдено`);

        const newActivationLink = uuid.v4();
        user.activationLink = newActivationLink;
        await user.save();

        await mailService.sendActivationMail(user.email, `https://ee79-93-170-44-29.ngrok-free.app/api/user/activate/${newActivationLink}`);
        return newActivationLink;
    }

    async updateUserInfo(token, firstName, secondName, patronymic, email, phoneNumber, req) {
        const userData = tokenService.validateAccessToken(token);
        if (!userData) throw ApiError.UnauthorizedError();

        const user = await UserModel.findById(userData.id);
        if (!user) throw ApiError.badRequest(`Користувача не знайдено`);

        if (firstName) user.firstName = firstName
        if (secondName) user.secondName = secondName
        if (patronymic) user.patronymic = patronymic

        if(user.email != email && email) {
            user.email = email
            const newActivationLink = uuid.v4();
            user.activationLink = newActivationLink;
            await mailService.sendActivationMail(email, `${process.env.API_URL}/api/user/activate/${newActivationLink}`);
            user.isActivated = false;
            req.app.get('io').emit('activationNeeded');
        }

        if (phoneNumber) user.phoneNumber = phoneNumber

        await user.save()
        return user
    }

    async updateUserAdmin(id, firstName, secondName, patronymic, email, phoneNumber, role, userDiscount) {
        const user = await UserModel.findById(id)
        if (!user) return ApiError.badRequest(`Користувача не знайдено`);

        if (firstName) user.firstName = firstName
        if (secondName) user.secondName = secondName
        if (patronymic) user.patronymic = patronymic
        if (email) user.email = email
        if (phoneNumber) user.phoneNumber = phoneNumber
        if (role) user.role = role
        if (userDiscount) user.userDiscount = userDiscount

        await user.save()
        return user
    }

    async remindUserPassword(token, email) {
        let user = null;

        if (token && token != "null") {
            try {
                const userData = tokenService.validateAccessToken(token);
                if (!userData) throw ApiError.UnauthorizedError();
                
                user = await UserModel.findById(userData.id);
            } catch (error) {
                throw ApiError.UnauthorizedError('Invalid or malformed token');
            }
        }

        if (!user && email) {
            user = await UserModel.findOne({ email });
        }
    
        if (!user) throw ApiError.badRequest('Користувача не знайдено');
    
        const resetLink = uuid.v4();
    
        await ResetLink.create({ user: user._id, link: resetLink }); // Save user ID and reset link
    
        const resetPasswordUrl = `${process.env.CLIENT_URL}/account/reset-password/${resetLink}`;
        mailService.sendPassword(user.email, resetPasswordUrl);
    
        return { status: 200, message: 'Посилання для зміни пароля було надіслано на Вашу електронну пошту' };
    }
    
    
    async resetUserPassword(resetLink, newPassword) {
        const link = await ResetLink.findOne({ link: resetLink });
        if (!link) throw ApiError.badRequest('Некоректне посилання збросу пароля');
    
        const user = await UserModel.findById(link.user);
        if (!user) throw ApiError.badRequest('Користувача не знайдено');
        
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
    
        await ResetLink.deleteOne({ link: resetLink }); 

        return { status: 200, message: "Пароль змінено" }
    }    

    async updatePassword(token, newPassword, previousPassword) {
        const userData = tokenService.validateAccessToken(token);
        if (!userData) throw ApiError.UnauthorizedError();
        
        let user = await UserModel.findById(userData.id);

        const isPassEquals = await bcrypt.compare(previousPassword, user.password);
        if(!isPassEquals) throw ApiError.badRequest('Неправильний пароль');

        const password = await bcrypt.hash(newPassword, 10)
        
        user.password = password
        user.save()

        return { status: 200, message: "Пароль змінено" }
    }

    async deleteAccount(token, refresh) {
        try {
            const userData = tokenService.validateAccessToken(token);
    
            const user = await UserModel.findById(userData.id);
            
            if (!user) {
                throw new Error("Користувача не знайдено");
            }
    
            const cartToDelete = await Cart.findOne({ userId: user._id });
  
            if (!cartToDelete) {
                throw new Error("Корзини не знайдено")
            }

            await Cart.deleteOne({ _id: cartToDelete._id });
            
            await tokenService.removeToken(refresh);
            await UserModel.findByIdAndDelete(user._id);
            
            return { status: 200, message: "Користувач видалений" };
        } catch (error) {
            throw new Error("Не вдалося видалити акаунт: " + error.message);
        }
    }

    async deleteUserById(id) {  
        try {
            await UserModel.findByIdAndDelete(id);
            return { status: 200, message: "Користувач видалений" };
        } catch (error) {
            throw new Error("Не вдалося видалити акаунт: " + error.message);
        }
    }
}

module.exports = new UserService(); 