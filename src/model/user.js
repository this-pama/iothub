const mongoose = require( 'mongoose')
let Schema = mongoose.Schema;

let UserSchema = new Schema({
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true
  },
  address: String,
  country: String,
  telephone: Number,
  imageUrl: String,
  account_id: {type: Schema.Types.ObjectId, ref: 'User Account ID', required : true },
  createdAt:  {
    type: Date,
    default: Date.now
  }
}, 
{ usePushEach: true });

module.exports = mongoose.model('User', UserSchema);
