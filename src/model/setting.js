const mongoose = require( 'mongoose')
const Schema = mongoose.Schema;

let Setting = new Schema({
  temperatureMax: Number,
  humidityMax: Number,
  eui : String,
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  createdAt:  {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Setting ', Setting );


