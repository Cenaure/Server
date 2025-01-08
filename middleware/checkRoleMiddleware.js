const jwt = require('jsonwebtoken');
const ApiError = require('../error/api-error');

module.exports = function(role){
    return function(req, res, next){
        if(req.method === "OPTIONS"){
            next();
        }
        try {
            const token = req.headers.authorization;
            if(!token) return next(ApiError.UnauthorizedError());

            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_ACCESS_SECRET);
            if(decoded.role != role){
                return next(ApiError.forbidden("Користувач не має доступу"))
            }

            res.user = decoded;
            next();
        } catch (error) {
            next(ApiError.UnauthorizedError())
        }
    }
}
