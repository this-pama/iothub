const mongoose = require( 'mongoose')
let Schema = mongoose.Schema;

let SensorSchema = new Schema({
  eui: {
    type: String,
    required: false
  },
  sensorType: {
    type: String,
    required: false
  },
  longitude: {
    type: String,
    required: false
  },
  latitude: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  data: [],
  userId: {type: Schema.Types.ObjectId, ref: 'User ID', required : true },
  createdAt:  {
    type: Date,
    default: Date.now
  }
}, 
{ usePushEach: true });

module.exports = mongoose.model('Sensor', SensorSchema);
