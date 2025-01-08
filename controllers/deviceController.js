const ApiError = require('../error/api-error');
const ImageService = require('../service/imageService');
const ProductService = require('../service/deviceService');

class DeviceController {
    constructor() {
        this.imageService = new ImageService("static");
        this.productService = new ProductService();

        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getBySlug = this.getBySlug.bind(this);
        this.getById = this.getById.bind(this);
        this.delete = this.delete.bind(this);
        this.update = this.update.bind(this);
        this.searchItem = this.searchItem.bind(this);
    }

    async create(req, res, next) {
        try {
            const product = await this.productService.productCreate({
                ...req.body,
                files: req.files,
                next,
            })
        
            return res.status(201).json(product);
        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    }
    
    async getAll(req, res, next) {
        try {
            const products = await this.productService.getAllProducts({...req.query})
            return res.status(200).json(products);
        } catch (error) {
            return next(ApiError.badRequest(error.message));
        }
    }
      
    async getBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const products = await this.productService.getProductBySlug(slug);
            return res.status(200).json(products);
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return next(error);
            }
            next(ApiError.internal(error.message));
        }
    }
    
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const products = await this.productService.getProductById(id);
            return res.json(products);
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return next(error);
            }
            next(ApiError.internal(error.message));
        }
    }

    async delete(req, res, next) {
        try {
            const { deviceIds } = req.body;
            const result = await this.productService.deleteProducts(deviceIds)
            res.status(200).json({ success: true, deletedCount: result.deletedCount });
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return next(error);
            }
            next(ApiError.internal(error.message));
        }
    }

    async update(req, res, next) {
        try {
            const updatedProduct = await this.productService.updateProduct({
                ...req.params,
                updatedItem: {...req.body},
                files: req.files
            })
            return res.status(200).json(updatedProduct);
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return next(error);
            }
            next(ApiError.internal(error.message));
        }
    }

    async searchItem(req, res, next) {
        try {
            const { searchInput } = req.query;
            const limit = req.params.limit || 12;
            const page = req.params.page || 0;
            const response = await this.productService.searchProduct({searchInput, limit, page})
            res.status(200).json(response)
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return next(error);
            }
            next(ApiError.internal(error.message));
        }
    }
}

module.exports = new DeviceController();