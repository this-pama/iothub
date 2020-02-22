const mongoose = require( 'mongoose')
const Schema = mongoose.Schema;

let SecretKey = new Schema({
  publicKey: {
    type: String,
    trim: true
  },
  privateKey: {
    type: String,
    trim: true
  },
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  createdAt:  {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SecretKey', SecretKey);


