const {Schema, model} = require('mongoose');
const TypeAttributeSchema = require('./typeAttribute-schema');

const TypeSchema = new Schema({
    name: {type: String, unique: true, required: true},
    attributes: [TypeAttributeSchema],
    icon: {type: String, unique: false},
    img: {type: String, unique: false},
    slug: {type: String, unique: true, required: true}
})

module.exports = model('Type', TypeSchema);