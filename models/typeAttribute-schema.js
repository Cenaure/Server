const {Schema} = require('mongoose');

const TypeAttributeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {type: Number, required: true},
  measurementUnit: {type: String, required: false},
  values: {type: [String], required: false, default: undefined}
}, { _id : false })

module.exports = TypeAttributeSchema;