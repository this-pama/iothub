import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import ExpoToken from '../model/expoPushToken'
import Expo from 'expo-server-sdk';
// Create a new Expo SDK client
let expo = new Expo();


// const {
//   TOKENTIME,
//   SECRET
// } = process.env;

const TOKENTIME= 2592000
const SECRET="W3_Hav3_th3_kn0w_h0w"

let authenticate = expressJwt({ secret : SECRET })

let generateAccessToken = (req, res, next) => {
  req.token = req.token || {};
  req.token = jwt.sign({
    id: req.user.id,
  }, SECRET, {
    expiresIn: TOKENTIME 
  });
  next();
}

let respond = (req, res) => {
  res.status(200).json({
    user: req.user.username,
    token: req.token,
    id: req.user.id,
  });
}

const sendPushNotification = async (userId, title, message, data )=>{
  ExpoToken.find({user: {
    username: userId,
}}, (err, expoToken)=>{ 
  if(err) return console.log(err)

  if(!expoToken || expoToken.length <= 0 ) return console.log('Device push token not found')

  else{

    let notifications = [];
    for (let pushToken of expoToken) {
      //check if it is a valid expo token
      if (!Expo.isExpoPushToken(pushToken.token.value)) {
        console.error(`Push token ${pushToken.token.value} is not a valid Expo push token`);
        continue;
      }

      notifications.push({
        to: pushToken.token.value,
        sound: 'default',
        title: title,
        body: message,
        data: data,
        badge: 1,
        _displayInForeground: true
      })
    }
    
    let chunks = expo.chunkPushNotifications(notifications);
    (async () => {
        for (let chunk of chunks) {
          try {
            let receipts = await expo.sendPushNotificationsAsync(chunk);
            console.log(receipts);
          } catch (error) {
            console.error(error);
          }
        }
      })();

      return

  }
})
}

module.exports = {
  authenticate,
  generateAccessToken,
  respond,
  sendPushNotification
};
