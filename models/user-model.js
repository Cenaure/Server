const {Schema, model} = require('mongoose');

const UserSchema = new Schema({
    firstName: {type: String, required: true},
    secondName: {type: String, required: true},
    patronymic: {type: String, required: false},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    role: {type: String, enum: ['admin', 'user'], default: "user"},
    phoneNumber: {type: String, required: false},
    userDiscount: {type: Number, default: 0, required: false},
    isActivated: {type: Boolean, default: false},
    activationLink: {type: String},
})

module.exports = model('User', UserSchema);