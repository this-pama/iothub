import mongoose from 'mongoose';
import { Router } from 'express';
import User from '../model/user';
import Setting from '../model/setting'
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

  // '/v1/setting' - GET all setting
  api.get('/', authenticate, (req, res) => {
    Setting.find({}, (err, setting) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      res.status(200).json({ success: true, message: setting});
    });
  });

  // '/v1/setting/:id' - GET a specific setting by its id 
  api.get('/:id', authenticate, (req, res) => {
    Setting.findById(req.params.id, (err, setting) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      return  res.status(200).json({ success: true, message: setting});
    });
  });

  // '/v1/setting/mysetting/:id' - GET all specific setting by the user id
  api.get('/mysetting/all/:id', (req, res) => {
    Setting.find({ userId : req.params.id }, (err, setting) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      return  res.status(200).json({ success: true, message: setting});
    });
  });

// '/v1/setting/mysetting/device' - GET a device setting using user id and eui
api.get('/mysetting/device', (req, res) => {
  Setting.findOne({ userId : req.body.userId, eui: req.body.eui }, (err, setting) => {
    if (err) {
      return res.status(400).json({ success: false, message: err});
    }

    return  res.status(200).json({ success: true, message: setting});
  });
});


  // '/v1/setting/add/:id' - POST - a settings for a device  { id is user ID}
  api.post('/add/:userId',authenticate, (req, res) => {
    Setting.findOne({ userId: req.params.userId, eui: req.body.eui },( err, setting)=>{
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }

      if (!setting) {
        let newSetting = new Setting({ 
          userId: req.params.userId,
          eui: req.body.eui,
          temperatureMax : req.body.temperatureMax,
          humidityMax: req.body.humidityMax
        })

        newSetting.save(err=>{
          if (err) {
            return res.status(400).json({ success: false, message: err});
          }

          return res.status(200).json({ success: true, message: "successful"});

        })
      }
      else{
        return res.status(200).json({ success: false, message: "setting data is already available. Update the data using a different endpoint"});
      }
    })
  });


  //update a setting
  api.put('/update/:id',authenticate, (req, res) => {
    let update = {
      temperatureMax: req.body.temperatureMax,
      humidityMax: req.body.humidityMax,
    }

    Setting.findOneAndUpdate( { userId: req.params.userId, eui: req.body.eui }, update , { new: true},  (err, setting) => {
      if (err) return res.status(400).json({ success: false, message: err});

      if(!setting)return res.status(200).json({ success: false, message: "No setting found"}); 

        return res.status(200).json({ success: true, message: setting });
    });
  });



  return api;
}
