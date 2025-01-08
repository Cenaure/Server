const ApiError = require("../error/api-error");
const ImageService = require("./imageService");
const Type = require('../models/type-model');
const SlugService = require("./slugService");
const { redisClient } = require("../redisClient");

class TypeService {
  constructor() {
    this.imageService = new ImageService("static");
  }

  async typeCreate({name, icon, next}) {
    if (!name) {
      next(ApiError.badRequest("Не вказане ім'я категорії"));
    }

    const existingType = await Type.findOne({ name });
    if (existingType) {
      next(ApiError.badRequest("Така категорія вже існує"));
    }

    const fileName = await this.imageService.handleFiles(icon)

    const slug = SlugService.generateSlug(name);

    const type = await Type.create({ name, icon: fileName, slug });

    return type;
  }

  async getAllTypes() {
    let types = await redisClient.get('type');
            
    if (!types) {
        types = await Type.find();
        await redisClient.setEx("type", 3600, JSON.stringify(types));
    } else {
        types = JSON.parse(types);
    }

    return types
  }

  async getTypeById(id, next) {
    const type = await Type.findById(id);

    if (!type) {
      next(ApiError.notFound("Категорію не знайдено"));
    }

    return type;
  }

  async getTypeBySlug(slug, next) {
    const type = await Type.findOne({slug: slug})

    if (!type) {
      next(ApiError.notFound("Категорію не знайдено"));
    }

    return type;
  }

  async deleteTypes(ids) {
    const typesToDelete = await Type.find({ _id: { $in: ids } });
    
    for (const type of typesToDelete) {
      await this.imageService.deleteImages(type.icon);
    }

    const result = await Type.deleteMany({ _id: { $in: ids } });

    redisClient.flushAll()

    return result
  }

  async updateType(updateData, next) {
    const {typeId, name, attributes, files} = updateData

    if (!typeId || !name) {
      next(ApiError.badRequest("Айді категорії та ім'я мають бути задані"))
    }

    const typeToUpdate = await Type.findById(typeId);
    if (!typeToUpdate) {
      next(ApiError.notFound("Категорію не знайдено"))
    }

    if(files) {
      files.imgs = files.icon;
      const fileName = await this.imageService.handleFiles(files)
      await this.imageService.deleteImages(typeToUpdate.icon)
      typeToUpdate.icon = fileName
    }

    typeToUpdate.name = name;

    const slug = SlugService.generateSlug(name);
    typeToUpdate.slug = slug;

    typeToUpdate.attributes = JSON.parse(attributes);
    await typeToUpdate.save();

    redisClient.flushAll()

    return typeToUpdate;
  }
}

module.exports = TypeService