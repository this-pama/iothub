import  mongoose from 'mongoose';
import { Router } from 'express';
import Account from '../model/account';
import User from '../model/user';
import bodyParser from 'body-parser';
import passport from 'passport';
const randomize = require('randomatic');
import Secret from '../model/secretKey'
var async = require('async');
var crypto = require('crypto');

import {generateAccessToken, respond, authenticate} from '../middleware/authMiddleware';

var api_key = 'cf2c68b67939b4ee3e2d784bde2e0336-c27bf672-d523064e';
var domain = 'mail.geekzdeck.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

export default ({ config, db }) => {
  let api = Router();

  // '/v1/account/register'
  api.post('/register', (req, res) => {
    if(!req.body.firstName || !req.body.lastName || 
      !req.body.email || !req.body.password){
        return res.status(200).json({
          success: false,
          message: "Please specify email, password, firstName, lastName, telephone"
        })
    }
    // console.log(req.body)

    Account.register(new Account({ username: req.body.email.toLowerCase()}), req.body.password.toString() , function(err, account) {
      // console.log(err)
      if (err) {
        return res.status(500).json(err);
      }

      passport.authenticate(
        'local', {
          session: false
      })(req, res, () => {

        // create user profile
        let newUser = new User({ 
          firstName: req.body.firstName,
          lastName : req.body.lastName,
          telephone : req.body.telephone
        });
        newUser.email = req.body.email;
        newUser.account_id = account._id;

        // Save user profile and reference it in Account db
        newUser.save(function(err, user) {  
          if (err) {
           return  res.status(400).json(err);
          }
            //  console.log(user )
            account.user = user._id;
            // Update Account db by referencing the user profile
            account.save( function(err, account) {
              if (err) {
                return res.status(400).json(err);
              }

              //create public and private key for user
              let publicKey = "iot-lora-public" + randomize('a0', 20);
              let privateKey = "iot-lora-private" + randomize('a0', 20);
              let newSecret = new Secret({publicKey, privateKey, userId : user._id });

              newSecret.save((err, secret)=>{
                if (err) {
                  return res.status(400).json(err);
                }
                  //send a welcome email
                  var data = {
                    from: 'IoT LoRa <welcome@iotlora.com>',
                    to: req.body.email,
                    subject: "Welcome",
                    text: "Welcome to the loRA Hub. Your public key is " + secret.publicKey + ". Your private key is " +
                    secret.privateKey + ". Please keep it save. You will need it in setting up on TTN."
                  };
          
                  mailgun.messages().send(data, function (error, body) {
                    console.log(body);
                  });

                  return res.status(200).json({ 
                    message: 'Successfully created new account',
                    userId: user._id,
                    success: true
                  });


              })

              
            })
        });

      });

    });
  });

  // '/v1/account/login'
  api.post('/login', passport.authenticate(
    'local', {
      session: false,
      scope: []
    }), generateAccessToken, respond);

  // '/v1/account/logout'
  api.get('/logout', authenticate, (req, res) => {
    req.logout();
    res.status(200).json({ message: 'Successfully logged out'});
  });

    // '/v1/account/:id' - GET a specific account
    api.get('/:id', authenticate, (req, res) => {
      Account.findById(req.params.id, (err, user) => {
        if (err) {
          res.status(400).json(err);
        }
        res.json(user);
      });
    });

     // '/v1/account/' - GET all account
     api.get('/', authenticate, (req, res) => {
      Account.find( {}, (err, user) => {
        if (err) {
          res.status(400).json(err);
        }
        res.json(user);
      });
    });

  api.get('/me', authenticate, (req, res) => {
    res.status(200).json(req.user);
  });


  api.post('/changepassword', function(req, res) {
    User.findById(req.body.userId, (err, user) => {
      // Check if error connecting
      if (err) {
        return res.json({ success: false, message: err }); // Return error
      } else {
        // Check if user was found in database
        if (!user) {
          return res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
        } else {
          Account.findById(user.account_id, (err, account)=>{
            if(err){ return res.status(400).json(err) }

            account.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
              if(err) {
                if(err.name === 'IncorrectPasswordError'){
                    res.json({ success: false, message: 'Incorrect password' }); // Return error
                }else {
                    res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                }
             } else {
                res.json({ success: true, message: account._id });
              }
            })

          })
          
        }
      }
    })  
  })

  api.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        Account.findOne({ username: req.body.email.toLowerCase() }, function(err, user) {
          if (!user) {
            return res.status(200).json({message : 'No account with that email address exists.'});
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var data = {
          from: 'IoT LoRa <donotreply-passwordreset@iotlora.com>',
          to: user.username,
          subject: "Password Reset",
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'Or use this token in your application: ' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n\n' +
          'IoT LoRa',
        };

        mailgun.messages().send(data, function (error, body) {
          console.log(body);
          done(error)
        });

        res.json({ success: true, message: user._id });
      }
    ], function(err) {
      if (err) return next(err);
     return  res.status(400).json(err);
    });
  });

  api.get('/reset/:token', function(req, res) {
    Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if(err) { return  res.status(400).json(err)}
      if (!user) {
        return res.status(200).json({message: 'Password reset token is invalid or has expired.'})
      }
      res.status(200).json({id : user._id, resetPasswordToken: user.resetPasswordToken })
    });
  });

  api.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if(err) { return  res.status(400).json(err)}
          if (!user) {
            return res.status(200).json({message: 'Password reset token is invalid or has expired.'});
          }
  
          // user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.setPassword(req.body.password, function(err,user){
            if (err) {
               return  res.json({success: false, message: 'Password could not be saved.Please try again!'})
            } else { 
              user.save(function(err, newUser) {
                if(err) { return  res.status(400).json(err) }

                res.json({success: true, message: newUser._id })
              });
                
              }
          })
        });
      },
      function(user, done) {
        var data = {
          from: 'IoT LoRa <donotreply-passwordreset@iot.com>',
          to: user.email,
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n',
        };

        mailgun.messages().send(data, function (error, body) {
          console.log(body);
          done(error)
        });
      }
    ], function(err) {
      if (err) return next(err);
     return  res.status(400).json(err);
    });
  });


  return api;
}
