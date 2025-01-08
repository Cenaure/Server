const Cart = require("../models/cart-model");
const Order = require("../models/order-model");
const mailService = require("./mailService");
const Device = require('../models/device-model');

class OrderService {
  async createOrder({req, userId}) {
    
    const { firstName, secondName, patronymic, email, phoneNumber,
      locality, deliveryType, warehouseDesc, street, house, apartment,
      paymentMethod, devices, deliveryPrice, devicesPrice, createdAt } = req.body;

    const order = await Order.create({
      user: { firstName, secondName, patronymic, email, phoneNumber, userId },
      delivery: { locality, deliveryType, warehouseDesc, street, house, apartment },
      paymentMethod,
      orderInformation: { devices, deliveryPrice, devicesPrice, createdAt }
    });

    req.app.get('io').emit('newOrderToAdmin', order);
    await mailService.sendOrderConfirmation(email);
    
    const cartToDelete = await Cart.findOne({ userId: userId });
  
    if (cartToDelete) await Cart.deleteOne({ _id: cartToDelete._id });

    const productIds = order.orderInformation.devices.map((device) => device.product || device._id);

    await Device.updateMany(
      { _id: { $in: productIds } },
      { 
        $inc: { 
          rating: 1, 
          amount: -1 
        } 
      }
    );

    return order
  }

  async updateStatus(req, orderId, status) {
    const order = await Order.findById(orderId);

    if (!order) {
      return next(ApiError.notFound('Заказ не знайдено'));
    }

    order.orderInformation.status = status;
    await order.save();

    req.app.get('io').emit('orderStatusUpdated');

    return { success: true, message: 'Статус замовлення успішно змінено' };
  }
}

module.exports = new OrderService();