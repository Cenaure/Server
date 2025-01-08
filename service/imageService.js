const uuid = require('uuid');
const path = require('path');
const sharp = require('sharp');
const fs = require("fs")

class ImageService {
    constructor(uploadDir) {
        this.uploadDir = uploadDir;
    }

    async handleFiles(files) {
        let fileNames = [];

        if (Array.isArray(files.imgs)) {
            for (let file of files.imgs) {
                await this.#generateNameAndCreateFile(file, fileNames)
            }
        } else if (typeof files.imgs === 'object' && files.imgs !== null) {
            let file = files.imgs;
            await this.#generateNameAndCreateFile(file, fileNames)
            return fileNames[0]
        }
        
        return fileNames;
    }

    async deleteImages(images) {
        if(Array.isArray(images)) {
            for (const image of images) {
                this.#deleteOneImage(image)
            }
        }   else if (typeof images === 'object' && images !== null) {
            this.#deleteOneImage(images)
        }
    }

    #generateFileName() {
        return uuid.v4() + ".webp";
    }

    async #processAndSaveFile(file, fileName) {
        const filePath = path.resolve(__dirname, '..', this.uploadDir, fileName.replace(path.extname(fileName), '.webp'));

        const thumbnailName = fileName.split('.')[0] + ".webp";
        const thumbnailPath = path.resolve(__dirname, '..', this.uploadDir, "thumbnails", thumbnailName);
    
        try {
            await sharp(file.data)
                .resize({ width: 800 })
                .webp({ quality: 80 })
                .toFile(filePath);

            await sharp(file.data)
                .blur(1)
                .resize(10)
                .webp({ quality: 80 })
                .toFile(thumbnailPath);

            return
        } catch (err) {
            throw new Error(`Error processing file: ${err.message}`);
        }
    }

    async #deleteOneImage(imageName) {
        const filePath = path.resolve(__dirname, '..', this.uploadDir, imageName);
        const thumbnailPath = path.resolve(__dirname, '..', this.uploadDir, "thumbnails", imageName);

        fs.unlink(filePath, error => {
            console.error(`Не вдалося видалити ${imageName}: ${error}`);
        });

        fs.unlink(thumbnailPath, error => {
            console.error(`Не вдалося видалити зменшену копію ${imageName}: ${error}`);
        });
    }

    async #generateNameAndCreateFile(file, fileNames) {
        const fileName = this.#generateFileName();
        await this.#processAndSaveFile(file, fileName);
        return fileNames.push(fileName);
    }
}

module.exports = ImageService;
