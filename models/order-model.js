const {Schema, model} = require('mongoose');
const AutoIncrementFactory = require('mongoose-sequence');
const mongoose = require('mongoose');

const AutoIncrement = AutoIncrementFactory(mongoose);

const UserInformationSchema = new Schema({
  firstName: {type: String, required: true},
  secondName: {type: String, required: true},
  patronymic: {type: String, required: true},
  email: {type: String, required: true},
  phoneNumber: {type: String, required: true},
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
}, {_id: false});

const DeliverySchema = new Schema({
  locality: {type: String, required: false},
  deliveryType: {type: String, required: true},
  warehouseDesc: {type: String},
  street: {type: String},
  house: {type: String},
  apartment: {type: String}
}, {_id: false});

const OrderInformationSchema = new Schema({
  devices: [],
  deliveryPrice: {type: Number, required: true},
  devicesPrice: {type: Number, required: true},
  createdAt: {type: Date, required: true},
  status: {type: String, required: true, default: "Розглядається"}
}, {_id: false})

const OrderSchema = new Schema({
  user: {type: UserInformationSchema, required: true},
  delivery: {type: DeliverySchema, required: true},
  paymentMethod: {type: String, required: true},
  orderInformation: {type: OrderInformationSchema, required: true},
});

OrderSchema.plugin(AutoIncrement, {inc_field: 'orderNumber'});

module.exports = model('Order', OrderSchema);