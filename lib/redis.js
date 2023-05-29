const util = require('util');
var config = require('../config')

var engine = {
  undefined: require('fakeredis'),
  test: require('fakeredis'),
  production: require('redis'),
  development: require('redis')
}[process.env.NODE_ENV]

var redis  = engine.createClient(config.redis);
redis.get = util.promisify(redis.get);
redis.set = util.promisify(redis.set);
// redis.keys=util.promisify(redis.);
// redis.flushall=util.promisify(redis.flushall);



redis.healthCheck = function (cb) {
  var now = Date.now().toString()
  redis.set('!healthCheck', now, function (err) {
    if (err) return cb(err)

    redis.get('!healthCheck', function (err, then) {
      if (err) return cb(err)
      if (now !== then.toString()) return cb(new Error('Redis write failed'))

      cb()
    })
  })
}

module.exports={redis};
