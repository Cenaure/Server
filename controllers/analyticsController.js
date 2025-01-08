const ApiError = require("../error/api-error");
const AnalyticsService = require("../service/analyticsService");

class AnalyticsController {
  constructor() {
    this.getAnalytics = this.getAnalytics.bind(this);

    this.analyticsService = new AnalyticsService()
  }

  async getAnalytics(req, res, next) {
    try {
      const currentDate = new Date();
      const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());

      const analytics = {
        recentOrders: await this.analyticsService.analyzeRecentOrders(),
        revenueData: await this.analyticsService.generateRevenueData()
      };
    
      res.json(analytics);
    } catch (error) {
      next(ApiError.internal(error.message))
    }
  }
}

module.exports = new AnalyticsController()