const ApiError = require('../error/api-error');
const Order = require('../models/order-model');
const tokenService = require('../service/tokenService');
const orderService = require('../service/orderService');

class OrderController {
  /*static async decreaseAmount(devices, next) {
    try {
        for (let deviceInfo of devices) {
            const deviceId = deviceInfo.product || deviceInfo._id
            const device = await Device.findById(deviceId);
            if (!device) {
                return next(ApiError.internal(`Товар за айді ${deviceInfo.id} не знайдено`));
            }
            if (device.amount > 0) {
                device.amount -= deviceInfo.quantity;
                await device.save();
            } else {
                return next(ApiError.internal(`Товар за айді ${deviceInfo.id} закінчився`));
            }
        }
    } catch (error) {
        next(ApiError.internal(error.message))
    }
  }*/

  async create(req, res, next) {
    try {
      const { firstName, secondName, patronymic, email, phoneNumber,
        deliveryType, paymentMethod, devices } = req.body;

      if (!firstName || !secondName || !patronymic || !email || !phoneNumber
        || !deliveryType || !paymentMethod) { // || !locality
        return next(ApiError.badRequest());
      }
      
      if (!devices || devices.length === 0) {
        return next(ApiError.badRequest());
      }
  
      const authHeader = req.headers['authorization'];
      let userId = null;
      if (authHeader) {
        const accessToken = authHeader.split(' ')[1];
        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) return next(ApiError.UnauthorizedError());

        userId = userData.id
      };

      const {result} = orderService.createOrder({req, userId})
      

      //await OrderController.decreaseAmount(devices, next);
      
      res.json(result);
    } catch (error) {
      next(ApiError.internal(error.message));
    }
  }  

  async resetCounter(){
    Order.counterReset('orderNumber', function(err) {});
  }

  async getAll(req, res, next){
    try {
      const {limit, page} = req.query
      let offset = (page || 1) * (limit || 10) - (limit || 10)

      const orders = await Order.find()
        .sort({'orderNumber': -1})
        .limit(limit)
        .skip(offset)
        .exec();

      let totalCount = await Order.countDocuments().exec()

      res.json({
        totalCount: totalCount,
        rows: orders,
      });
    } catch (error) {
      next(ApiError.internal(error.message))
    }
  }

  async getOrders(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];
      
      if (!accessToken) {
        return next(ApiError.UnauthorizedError());
      }
      const userId = tokenService.validateAccessToken(accessToken).id;
      
      console.log(userId)

      const orders = await Order.find({'user.userId': userId});
      
      res.json(orders);
    } catch (error) {
      next(ApiError.internal(error.message));
    }
  }
  
  
  async update(req, res, next){
    try {
      const {user, delivery, paymentMethod, orderInformation} = req.body;
      const {id} = req.params

      if (!id) {
        throw new ApiError(400, 'Не вказан ID замовлення');
      }

      const order = await Order.findById(id);

      if (!order) {
        throw new ApiError(404, 'Заказ не знайдено');
      }

      order.user = user;
      order.delivery = delivery;
      order.paymentMethod = paymentMethod;
      order.orderInformation = orderInformation;

      await order.save();

      res.json(order);
    } catch (error) {
      next(ApiError.internal(error.message))
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const { id } = req.params;

      if (!id || !status) {
        return next(ApiError.badRequest('Не вказан ID або статус замовлення'));
      }

      const orderStatusUptateResult = await orderService.updateStatus(req, id, status);

      res.json(orderStatusUptateResult);
    } catch (error) {
      next(ApiError.internal(error.message));
    }
  }

  async getCount(req, res, next) {
    try {
      const count = await Order.countDocuments({
        'orderInformation.status': 'Розглядається',
      });

      res.json({
        count: count,
      });
    } catch (error) {
      next(ApiError.internal(error.message))
    }
  }
}

module.exports = new OrderController