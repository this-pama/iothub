import express from 'express';
import config from '../config';
import initializeDb from '../db';
import middleware from '../middleware';
import user from '../controller/user';
import account from '../controller/account';
import sensor from '../controller/sensor'
import setting from '../controller/setting'
import http from 'http';


let router = express();
// var server = http.createServer(router);
// var io = require('socket.io')(server);

// connect to db
initializeDb(db => {

  // internal middleware
  router.use(middleware({ config, db }));

  // api routes v1 (/v1)
  router.use('/user', user({ config, db }));
  router.use('/account', account({ config, db }));
  router.use('/sensor', sensor({ config, db }));
  router.use('/setting', setting({ config, db }));

  
});

export default router;
