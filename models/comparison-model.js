const { Schema, model } = require('mongoose');

const ComparisonSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  comparisons: [{
      category: { type: Schema.Types.ObjectId, ref: 'Type' },
      deviceIds: [{ type: Schema.Types.ObjectId, ref: 'Device', _id: false }], 
      _id: false
  }]
});


module.exports = model('Comparison', ComparisonSchema);
