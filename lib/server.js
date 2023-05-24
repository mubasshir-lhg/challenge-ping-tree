const express=require("express");
const app=express();
const morgan=require("morgan");
const redisClient=require("./redis");

app.use(express.json({}))

// To log every request and their response...
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
})
)

app.get('/',(rew, res)=>{
  res.send("SERVER IS RUNNING ")
})

app.use("/",require("../routes/target.route"));


const PORT= process.env.PORT || 5000;
const server=app.listen(PORT,async ()=>{
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
  redisClient.on('error', err => console.log('Redis Client Error', err));
});

module.exports=server;