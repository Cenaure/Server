const SlugService = require("./slugService");
const Device = require('../models/device-model');
const { redisClient } = require('../redisClient');
const ApiError = require("../error/api-error");
const { default: mongoose } = require("mongoose");
const ImageService = require("./imageService");
const fuzzysort = require("fuzzysort");

class ProductService {
  constructor() {
    this.imageService = new ImageService("static")
  }

  async productCreate(productData) {
    const {
      name,
      article,
      measurementUnits,
      status,
      purchaseType,
      price,
      amount,
      discount,
      typeId,
      description,
      tags,
      access,
      files,
      next
    } = productData;
    
    const existingProducts = await Device.findOne({ name });

    if (existingProducts) {
      return next(ApiError.badRequest("Товар з такою назвою вже існує"));
    }

    const fileNames = files ? await this.imageService.handleFiles(files) : [];

    const slug = SlugService.generateSlug(name);

    const product = await Device.create({
      name,
      article,
      measurementUnits,
      status,
      purchaseType,
      price,
      amount,
      discount,
      imgs: fileNames,
      typeId,
      description,
      tags,
      access,
      slug
    });

    return product
  }

  async getAllProducts(filtersData) {
    const { typeId, selectedAttributes, filterMinPrice, filterMaxPrice, sorting, search } = filtersData
    const limit = filtersData.limit || 10;
    const page = filtersData.page || 1;
    let offset = page * limit - limit;
    let devices;
    let totalCount;
    let attributesFilter = [];

    if (selectedAttributes) {
      try {
        attributesFilter = JSON.parse(decodeURIComponent(selectedAttributes));
      } catch (error) {
        throw ApiError.badRequest('Invalid selectedAttributes format');
      }
    }

    const query = {};
    if (typeId) {
      query.typeId = typeId;
    }

    // Атрибути
    if (Object.keys(attributesFilter).length > 0) {
      const attributeConditions = Object.keys(attributesFilter).map(attributeName => ({
        attributes: {
          $elemMatch: {
            name: attributeName,
            value: { $in: attributesFilter[attributeName] }
          }
        }
      }));
      query.$and = attributeConditions;
    }

    // Ціна
    if (filterMinPrice || filterMaxPrice) {
      query.price = {};
      if (filterMinPrice) {
        query.price.$gte = parseFloat(filterMinPrice);
      }
      if (filterMaxPrice) {
        query.price.$lte = parseFloat(filterMaxPrice);
      }
    }

    // Ціна
    let sortOption = {};
    if (sorting == "За збільшенням ціни") {
      sortOption.price = 1;
    } else if (sorting == "За зменшенням ціни") {
      sortOption.price = -1;
    } else {
      sortOption.rating = -1;
    }

    // Пошук
    if (search) {
      const searchResults = await this.searchProduct({ searchInput: search, limit: 10000, page: 0 });
      const searchIds = searchResults.items.map(device => device._id);

      console.log(search)
      query._id = { $in: searchIds };
    }

    const redisKey = `devices:${JSON.stringify(query)}:${limit}:${offset}:${sorting}`;
    const cachedDevices = await redisClient.get(redisKey);

    if (cachedDevices) {
      return JSON.parse(cachedDevices);
    }

    devices = await Device.find(query)
      .limit(limit)
      .skip(offset)
      .sort(sortOption)
      .exec();

    const prices = devices.map(device => device.price);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    totalCount = await Device.countDocuments(query).exec();

    const response = {
      totalCount: totalCount,
      rows: devices,
      minPrice: minPrice,
      maxPrice: maxPrice
    };

    await redisClient.set(redisKey, JSON.stringify(response), 'EX', 3600);

    return response
  }

  async getProductBySlug(slug) {
    const slugs = slug.split(',');
    
    const products = await Device.find({ slug: { $in: slugs } });
    if (products.length === 0) {
      throw ApiError.notFound('Товар не знайдено');
    }

    return products
  }

  async getProductById(id) {
    const ids = id.split(',').map(id => id.trim());

    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      throw ApiError.notFound('Товар не знайдено');
    }

    const products = await Device.find({ _id: { $in: ids } });

    const unpackedProducts = products.map(product => Array.isArray(product) ? product[0] : product);

    if (products.length === 0 && unpackedProducts.length === 0) {
      throw ApiError.notFound('Товар не знайдено');
    }

    return unpackedProducts
  }

  async deleteProducts(productIds) {
    if (typeof productIds !== 'string') {
      throw ApiError.internal('Invalid productIds format');
    }

    const ids = productIds.split(',');
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      throw ApiError.notFound('Товар не знайдено');
    }

    const productsToDelete = await Device.find({ _id: { $in: ids } });

    for (const device of productsToDelete) {
      await this.imageService.deleteImages(device.imgs);
    }

    const deleteResponse = await Device.deleteMany({ _id: { $in: ids } });

    return deleteResponse
  }

  async updateProduct(updateData) { 
    const { id, files } = updateData;
    let updatedItem = updateData.updatedItem;

    const product = await Device.findById(id);
    if (!product) {
      throw ApiError.notFound(`Товар за айді ${id} не знайдено`);
    }

    if (files) {
      await this.imageService.deleteImages(product.imgs);
      const fileNames = await this.imageService.handleFiles(files);
      updatedItem.imgs = fileNames;
    }
    
    const slug = SlugService.generateSlug(updatedItem.name);
    updatedItem.slug = slug;

    //updatedItem.tradePrice != "undefined" ? updatedItem.tradePrice = Number(tradePrice) : updatedItem.tradePrice = undefined
    
    const updatedDevice = await Device.findByIdAndUpdate(id, updatedItem, { new: true });
  
    return updatedDevice
  }

  async searchProduct({searchInput, limit, page}) {
    const products = await Device.find();

    const productsToSearch = products.map(device => ({
      name: device.name,
      id: device._id,
      device: device
    }));
     
    const results = fuzzysort.go(searchInput, productsToSearch, {
      key: 'name',
      threshold: -10000, 
      limit: limit //?
    });

    const foundDevices = results.map(result => result.obj.device);
    const totalCount = foundDevices.length
     
    const items = foundDevices.slice(page * limit, page * limit + limit)
    
    if (!foundDevices.length) {
      throw ApiError.notFound("Жодного товару не знайдено")
    }

    return { items, totalCount };
  }
}

module.exports = ProductService