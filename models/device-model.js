const { Schema, model } = require('mongoose');
const AttributeSchema = require('./attribute-schema');

const isRequired = function() {
    return this.access !== 'Чернетка';
};

const DeviceSchema = new Schema({
    name: { type: String, unique: true, required: true },
    article: { type: String, unique: true, required: isRequired },
    measurementUnits: { type: String, required: isRequired },
    status: { type: String, required: isRequired },
    purchaseType: { type: String, required: isRequired },
    price: { type: Number },
    amount: { type: Number },
    discount: { type: Number, default: 0 },
    imgs: [{ type: String, required: isRequired }],
    typeId: { type: Schema.Types.ObjectId, ref: 'Type' },
    description: { type: String },
    tags: { type: [String] },
    access: { type: String, required: true },
    slug: { type: String, unique: true },
    rating: { type: Number, default: 0 },
    attributes: [AttributeSchema]
});


module.exports = model('Device', DeviceSchema);
