import mongoose from "mongoose"

let Schema = mongoose.Schema

let expoPushToken = new Schema({
    token: {
        value: String,
      },
    user: {
        username: String,
    },
    createdAt:  {
        type: Date,
        default: Date.now
      }
})

module.exports = mongoose.model("Expo Push Token", expoPushToken)