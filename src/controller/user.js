import mongoose from 'mongoose';
import { Router } from 'express';
import User from '../model/user';
import Secret from '../model/secretKey'
import Account from '../model/account';
import ExpoToken from "../model/expoPushToken"
import Expo from 'expo-server-sdk';
var api_key = 'cf2c68b67939b4ee3e2d784bde2e0336-c27bf672-d523064e';
var domain = 'mail.geekzdeck.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

// Create a new Expo SDK client
let expo = new Expo();

import { authenticate } from '../middleware/authMiddleware';

export default({ config, db }) => {
  let api = Router();

  // '/v1/user' - GET all users
  api.get('/', authenticate, (req, res) => {
    User.find({}, (err, users) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      return res.status(200).json({ success: true, message: users });
    });
  });

  // '/v1/user/:id' - GET a specific user 
  api.get('/:id', authenticate, (req, res) => {
    User.findById(req.params.id, (err, user) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      return res.status(200).json({ success: true, message: user });
    });
  });

  // '/v1/user/byAccountId/:id' - GET a specific user by the account id
  api.get('/byAccountId/:id', (req, res) => {
    User.findOne({ account_id : req.params.id }, (err, user) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      return res.status(200).json({ success: true, message: user });
    });
  });


  // '/v1/user/add/:id' - POST - update a user  { id is user ID}
  api.put('/add/:id',authenticate, (req, res) => {

    User.findByIdAndUpdate( req.params.id, req.body ,  (err, user) => {
      if (err){
        return res.status(400).json({ success: false, message: err});
      }
      return res.status(200).json({ success: true, message: user });
    });
  });


  //get user secrets
  api.get("/secret/:userId", (req, res)=>{
    Secret.findOne({ userId : req.params.userId}, (err, secret)=>{
      if (err){
        return res.status(400).json({ success: false, message: err});
      }
      return res.status(200).json({ success: true, message: secret });
    })

  })



 //Save Expo Push Notification Token
 api.post('/push-token', (req, res)=>{
    ExpoToken.find({ token: {
        value: req.body.token.value,
      },
      user: {
        username: req.body.user.username
    }
    }, (err, savedToken)=>{
      if(err){ return res.status(400).json({ success: false, message: err}); }
      
      if( savedToken.length > 0){
        return res.status(200).json({ success: false, message: "token already saved"})
      }

        let saveToken = new ExpoToken(req.body)
          saveToken.save(err=>{
            if(err){ return res.status(400).json({ success: false, message: err});}
            return res.status(200).json({ success: true , message: "Token saved"})
          }) 
      
    })  
})


  api.post('/send-app-notification',(req, res)=>{

    if(!req.body.message || !req.body.userId || !req.body.title){
      return  res.status(200).json({ success: false, message: 'Please specify userId, title and message'})
    }

    ExpoToken.find({user: {
      username: req.body.userId,
  }}, (err, expoToken)=>{ 
    if(err){ return res.status(400).json({ success: false, message: err});}

    if(!expoToken || expoToken.length <= 0 ) return res.status(200).json({ success: false, message: 'Device push token not found'})

    else{
      // console.log("expo token", expoToken)
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
          title: req.body.title,
          body: req.body.message,
          data: req.body.data,
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

  })

  return api;
}
