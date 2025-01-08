const {Schema, model} = require('mongoose');

const ResetLink = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    link: {type: String, unique: true, require: true},
})

module.exports = model('ResetLink', ResetLink);