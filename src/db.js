import mongoose from 'mongoose';

export default callback => {

  const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB
  } = process.env;
  
  const options = {
    useNewUrlParser: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500,
    connectTimeoutMS: 10000,
  };
  
  const herokuDbUrl = "mongodb://adedapopaul:Moronkeji_2016@ds115472.mlab.com:15472/iot-hub"
  const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
  
  let db = mongoose.connect(herokuDbUrl, options).then( function() {
              console.log('MongoDB is connected');
            })
              .catch( function(err) {
              console.log(err);
            });
            
  callback(db);
}
