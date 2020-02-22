const mongoose = require( 'mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require( 'passport-local-mongoose')

let Account = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true
   },
  password: {
    type: String,
    trim: true
  },
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt:  {
    type: Date,
    default: Date.now
  }
});

Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);


