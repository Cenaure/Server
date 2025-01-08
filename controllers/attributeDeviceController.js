const ApiError = require('../error/api-error');
const Device = require('../models/device-model');
const Type = require('../models/type-model');

class AttributeDeviceController {
  async createAttribute(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { attributes } = req.body;
  
      if (!attributes) {
        return next(ApiError.badRequest('Атрибути не вказані'));
      }
  
      const attributesArray = Object.values(attributes);
  
      let device = await Device.findById(deviceId);
      if (!device) {
        return next(ApiError.badRequest('Пристрій не знайдено'));
      }
  
      device.attributes = attributesArray;
  
      await device.save();
  
      res.json(device);
    } catch (error) {
      next(ApiError.internal(error.message));
    }
  }

  async updateAttribute(req, res, next) {
    const { deviceId, attributeName } = req.params;
    const { value } = req.body;
    
    try {
      const device = await Device.findById(deviceId);
  
      if (!device) {
        return ApiError.badRequest('Товар не знайдений');
      }
  
      let attribute = device.attributes.find(attr => attr.name === attributeName);
  
      if (!attribute) {
        device.attributes.push({
          name: attributeName,
          value: value
        });
      } else {
        attribute.value = value;
      }
  
      await device.save();
      
      res.json(device);
    } catch (err) {
      next(ApiError.internal(err.message));
    }
  }
}

module.exports = new AttributeDeviceController