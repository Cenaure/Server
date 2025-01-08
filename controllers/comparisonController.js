const ApiError = require("../error/api-error");
const tokenService = require("../service/tokenService");
const Comparison = require('../models/comparison-model')
const mongoose = require('mongoose');

class ComparisonController {
  async addToComparison(req, res, next){
    try {
      const {deviceId} = req.body
      const {typeId} = req.params

      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];
      if(!accessToken) next(ApiError.UnauthorizedError())
      const userData = tokenService.validateAccessToken(accessToken)
      
      let userComparison = await Comparison.findOne({userId: userData.id})
      if(!userComparison) {
        userComparison = await Comparison.create({userId: userData.id, comparisons: [{ category: typeId, deviceIds: [deviceId] }]})
      } else {
        let comparisonCategory = userComparison.comparisons.find(c => c.category.toString() === typeId);
        if(!comparisonCategory) {
          comparisonCategory = { category: typeId, deviceIds: [deviceId] };
          userComparison.comparisons.push(comparisonCategory);
        } else {
          const deviceIndex = comparisonCategory.deviceIds.indexOf(deviceId);
          if(deviceIndex > -1) {
            comparisonCategory.deviceIds.splice(deviceIndex, 1);
          } else {
            comparisonCategory.deviceIds.push(deviceId);
          }
        }

        if(comparisonCategory.deviceIds.length === 0) {
          userComparison.comparisons = userComparison.comparisons.filter(c => c.category.toString() !== typeId);
        }
      }

      await userComparison.save();

      return res.json(userComparison)
    } catch (error) {
      next(ApiError.internal(error.message))
    }
  }

  async getByUserId(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];
      if(!accessToken) next(ApiError.UnauthorizedError())
      const userData = tokenService.validateAccessToken(accessToken)

      const foundedComparison = await Comparison.find({userId: userData.id})
      if(!foundedComparison) return null

      return res.json(foundedComparison)
    } catch (error) {
      next(ApiError.internal(error.message))
    }
  }
}



module.exports = new ComparisonController();