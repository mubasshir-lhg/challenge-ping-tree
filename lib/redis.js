const util = require('util');

const {createClient}=require("redis");

const client=createClient({
  hostname:process.env.REDIS_HOST,
  port:process.env.REDIS_PORT,
  password:process.env.REDIS_PASS,
})
client.get = util.promisify(client.get);
client.set = util.promisify(client.set);
client.flushall=util.promisify(client.flushall);

module.exports=client;




