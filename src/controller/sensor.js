import mongoose from 'mongoose';
import { Router } from 'express';
import User from '../model/user';
import Account from '../model/account';
import ExpoToken from "../model/expoPushToken"
import Sensor from '../model/sensor'
import Secret from '../model/secretKey'
import Setting from '../model/setting'
import Expo from 'expo-server-sdk';
var api_key = 'cf2c68b67939b4ee3e2d784bde2e0336-c27bf672-d523064e';
var domain = 'mail.geekzdeck.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

// Create a new Expo SDK client
let expo = new Expo();

import { authenticate } from '../middleware/authMiddleware';

export default({ config, db }) => {
  let api = Router();

  // '/v1/sensor' - GET all sensors
  api.get('/', authenticate, (req, res) => {
    Sensor.find({}, (err, sensor) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }
      res.status(200).json({ success: true, message: sensor});
    });
  });

  // '/v1/sensor/:id' - GET a specific sensor by it's id 
  api.get('/:id', authenticate, (req, res) => {
    Sensor.findById(req.params.id, (err, sensor) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }

      if(!sensor)return res.status(400).json({ success: false, message: "No sensor found"}); 

      res.status(200).json({ success: true, message: sensor });
    });
  });

  //  - GET all sensor attached to a user
  api.get('/mysensor/:id', (req, res) => {
    User.find({ userId: req.params.id }, (err, sensor) => {
      if (err) {
        return res.status(400).json({ success: false, message: err});
      }

      res.status(200).json({ success: true, message: sensor });
    });
  });

// '/v1/sensor/add/:id' - POST add a sensor  { id is user ID}
api.post('/add/:userId',authenticate, (req, res) => {
  let data = {
    eui: req.body.eui,
    userId: req.params.userId,
    sensorType: req.body.sensorType,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    name: req.body.name,
    description: req.body.description
  }

  if( !req.body.eui || !req.body.name || !req.body.description) return res.status(200).json({ success: false, message: "specify  name, eui, and description"}); 

  let newSensor = new Sensor(data)
  newSensor.save((err, sensor)=> {
    if (err) return res.status(400).json({ success: false, message: err});

    return res.status(200).json({ success: true, message: sensor });
  })

});


  // '/v1/sensor/update/:id' - PUT - update a a sensor  
  api.put('/update/:eui',authenticate, (req, res) => {
    let update = {
      sensorType: req.body.sensorType,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      name: req.body.name,
      description: req.body.description
    }

    if(!req.body.userId) return res.status(200).json({ success: false, message: "specify user id"}); 

    Sensor.findOneAndUpdate( {eui: req.params.eui, userId: req.body.userId }, update , { new: true},  (err, sensor) => {
      if (err) return res.status(400).json({ success: false, message: err});

      if(!sensor) return res.status(200).json({ success: false, message: "No sensor found"}); 

        return res.status(200).json({ success: true, message: sensor });
    });
  });


  // '/v1/sensor/application/webhook' - POST - update a a sensor  { id is user ID}
  api.post('/application/webhook', (req, res) => {
    console.log(req.body)
    // console.log(req.headers)
    var publicKey = req.headers["authorization"];
    var privateKey = req.headers["privateKey"];

    if(!publicKey || !privateKey) {
      console.log('aaplication is not authorized')
      return res.send(500);
    }

    Secret.findOne({
      privateKey, publicKey
    }, (err, key)=>{
      if (err){
        console.log(err) 
        return res.status(500).json({ success: false, message: err});
      }

      if(!key) {
        console.log( "No record of keys found") 
        return res.status(500).json({ success: false, message: "No record of keys found"});
      } 

      Sensor.findOne({
        userId: key.userId,
        eui : req.body.hardware_serial
      }, (err, sensor)=>{
        if (err) return res.status(500).json({ success: false, message: err});

        if(!sensor) return res.status(500).json({ success: false, message: "No sensor found"});
        
        // //check if payload has temp and humidity value
        // if(!req.body.payload_fields.temperature || !req.body.payload_fields.humidity) {

        //   return res.status(200).json({ success: false, message: "No temp or humidity value"});
        // }

        sensor.data.push(req.body)
        sensor.save((err, data)=>{
          if (err) return res.status(200).json({ success: false, message: err});

          Setting.findOne({
            eui: req.body.hardware_serial,
            userId: key.userId
          }, (err, setting)=>{
            if (err) { 
              console.log(err);
              return res.send(200)
            }
    
            if(!setting) {
              console.log("No settings found");
              return res.send(200)
            }

            if(setting && (!setting.temperatureMax || !setting.humidityMax)){
              console.log("No value in settings")
              return res.send(200)
            }
            else{

            User.findById(key.userId, (err, user)=>{
              if (err) console.log(err);
    
              if(!user) console.log("No user found");

              
                if ( +req.body.payload_fields.temperature >= setting.temperatureMax){
                  //send alert messages
                  var data = {
                    from: 'IoT LoRa <alert@iotlora.com>',
                    to: user.email || "adedapopaul@yahoo.com",
                    subject: "Alert",
                    text: "Alert message. " + "Temperature value is " + req.body.payload_fields.temperature
                  };
          
                  mailgun.messages().send(data, function (error, body) {
                    console.log(body);
                  });

                }
                else if ( +req.body.payload_fields.humidity >= setting.humidityMax){
                  //send alert messages
                  var data = {
                    from: 'IoT LoRa <alert@iotlora.com>',
                    to: user.email || "adedapopaul@yahoo.com",
                    subject: "Alert",
                    text: "Alert message. " + "Humidity value is " + req.body.payload_fields.humidity
                  };
          
                  mailgun.messages().send(data, function (error, body) {
                    console.log(body);
                  });

                }
                else{ 
                  console.log(" nothing to do") 
                }

                return res.send(200)
            })
          }
            

            
          })

          

        })

      })

    })



  });


  return api;
}
