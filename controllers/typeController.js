const ApiError = require('../error/api-error');
const uuid = require('uuid')
const path = require('path');
const fs = require('fs');
const { redisClient } = require('../redisClient');
const SlugService = require('../service/slugService');
const TypeService = require('../service/typeService');
const Type = require('../models/type-model');

class TypeController {
    constructor() {
        this.typeService = new TypeService()

        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getOne = this.getOne.bind(this);
        this.getBySlug = this.getBySlug.bind(this);
        this.deleteTypes = this.deleteTypes.bind(this);
        this.changeType = this.changeType.bind(this);
    }

    async create(req, res, next) {
        try {
            const { name } = req.body;
            const { icon } = req.files;

            const type = await this.typeService.typeCreate({name, icon, next})
            
            redisClient.flushAll()
            
            res.status(200).json(type);
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }
    

    async getAll(req, res, next) {
        try {            
            const types = await this.typeService.getAllTypes();
            res.status(200).json(types);
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const { typeId } = req.params;
            const type = await this.typeService.getTypeById(typeId, next)
            return res.status(200).json(type)
        } catch (error) {
            next(ApiError.internal(error.message));
        }
    }

    async getBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const type = await this.typeService.getTypeBySlug(slug, next)
            return res.status(200).json(type)
        } catch (error) {
            next(ApiError.internal(error.message));
        }
    }

    async deleteTypes(req, res, next){
        try {
            const { typeIds } = req.body;
            const result = await this.typeService.deleteTypes(typeIds)
            res.json({ success: true, deletedCount: result.deletedCount });
        } catch(error) {
            next(ApiError.internal(error.message));
        }
    }

    async changeType(req, res, next){
        try {
            const updatedType = await this.typeService.updateType({
                ...req.params,
                ...req.body,
                files: {...req.files},
            }, next)
            return res.json(updatedType);
        } catch(error) {
            next(ApiError.internal(error.message));
        }
    }
}

module.exports = new TypeController;