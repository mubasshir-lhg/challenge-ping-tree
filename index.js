// Configuring to read .env file
require("dotenv").config({
    path:".env"
  });
var name = require('./package.json').name
require('productionize')(name)
const server=require('./lib/server');

module.exports=server;
