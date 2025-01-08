const Order = require("../models/order-model")

class AnalyticsService {
  async analyzeRecentOrders() {
    const orders = await Order.find();

    const sortedOrders = orders.sort((a, b) => new Date(b.orderInformation.createdAt).getTime() - new Date(a.orderInformation.createdAt).getTime());

    const recentOrders = sortedOrders.slice(0, 5);

    return recentOrders.map(order => ({
      id: order._id,
      products: order.orderInformation.devices,
      status: order.orderInformation.status,
      total: order.orderInformation.devicesPrice + order.orderInformation.deliveryPrice,
      createdAt: order.orderInformation.createdAt,
      userInfo: {
        firstName: order.user.firstName,
        secondName: order.user.secondName,
      }
    }));
  }

  async generateRevenueData() {
    const orders = await Order.find();

    const revenueByDate = orders.reduce((acc, order) => {
      const date = order.orderInformation.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + order.orderInformation.devicesPrice + order.orderInformation.deliveryPrice
      return acc
    }, {})

    return Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue
    }))
  }
}

module.exports = AnalyticsService