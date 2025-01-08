const { default: slugify } = require("slugify");

class SlugService {
  static generateSlug(name) {
    return slugify(name, {
        replacement: '-',
        lower: true,
        strict: false,
        locale: 'en_US',
        trim: true
    });
  }
}

module.exports = SlugService