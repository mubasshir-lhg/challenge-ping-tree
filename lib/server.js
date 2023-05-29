var URL = require('url')
var http = require('http')
var cuid = require('cuid')
var Corsify = require('corsify')
var sendJson = require('send-data/json')
var ReqLogger = require('req-logger')
var healthPoint = require('healthpoint')
var HttpHashRouter = require('http-hash-router');
const { send, json } = require('micro');
var {redis} = require('./redis');
const {getTargets, getTargetById, getUtcDate, getUtcHour}=require("../utils/common")
var version = require('../package.json').version;



var router = HttpHashRouter()
var logger = ReqLogger({ version: version })
var health = healthPoint({ version: version }, redis.healthCheck)
var cors = Corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, accept, content-type'
});


router.set('/favicon.ico', empty)

router.set('/api/targets', async (req, res) => {
  console.log("=============================> GETTING TARGETS")
  switch (req.method) {
    case 'GET':{
      try {
        console.log("GETTING ALL TARGETS")
        const targets=await getTargets();
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({success:true,targets})); 
    } catch (error) {
      console.log(error)
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({success:false,error}));
    }}
      
      break;
      case 'POST':{
       try {
        const data= await json(req);
        const targets=await getTargets();
        const target=await redis.set("TARGETS",JSON.stringify([{id:cuid(),...data},...targets]));
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(JSON.stringify({success:true,target}));
       } catch (error) {
        console.log(error)
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({success:false,error}));
       }
      }
  
    default:
      break;
  }
});


router.set('/api/targets/:id',async (req,res,params)=>{
  console.log("GET TAGET BY ID");
  const {params:{id}}=params;
  switch (req.method) {
    case "GET":{
     try {
      const target=await getTargetById(id)
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = target?200:400;
      res.end(JSON.stringify({success:target?true:false,target}));
     } catch (error) {
      console.log(error)
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({success:false,error}));
     }
    }
      break;
    case "POST":{
      try {
        const data= await json(req);
        const target=await getTargetById(id);
        if(!target){
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.end(JSON.stringify({success:false,error:"No target found"}));
            
        }else{
            const score=JSON.parse(await redis.get("SCORE"));
            const utcDate= getUtcDate(data.timestamp);
            console.log("utcDate =====> ",utcDate)
            if(!score){
                await redis.set("SCORE",JSON.stringify({[utcDate]:{[id]:1}}))
            }else{
              const scoreDateObj=score[utcDate];
                if(!scoreDateObj){
                    console.log("IF WE DON'T HAVE DATE OBJ IN SCORE")
                    score[utcDate]={
                        [id]:1
                    }
                await redis.set("SCORE",JSON.stringify(score))
    
                }else{
                    console.log("IF WE DO HAVE DATE IN SCORE OBJECT")
                    if(scoreDateObj[id]){
                        console.log("IF WE DON HAVE DATE AND ALSO ID OF TARGET THAN INCREASE NUMBER OF ATTEMPTS")
                        scoreDateObj[id]+=1;
                        if(scoreDateObj[id]>target["maxAcceptsPerDay"]*1){
                              throw new Error("Limit exceeded")
                        }
                    }
                    else{
                        console.log("IF WE DON HAVE DATE BUT NOT ID OF TARGET THAN SET ATTEMP AS 1")
                        scoreDateObj[id]=1;
                    }
                    await redis.set("SCORE",JSON.stringify(score))
                }
            }
    
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({success:true}));
        }
       
     } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({success:false,error:error?.message}));
      }
    }
    default:
      break;
  }
})


router.set("/route",async (req,res)=>{
   switch (req.method) {
    case "POST":{
     try {
      console.log("GETTING DECISION")
      const data= await json(req);
      const {geoState:userGeoState,timestamp}=data;
      const utcHour=getUtcHour(timestamp);
      const targets=await getTargets();
      if(targets.length){
          const targetWithGeoState=targets.filter((target)=>target["accept"]["geoState"]["$in"].indexOf(userGeoState)>=0&&target["accept"]["hour"]["$in"].indexOf(utcHour)>=0);
          if(targetWithGeoState.length){
              const sortedTargets=targetWithGeoState.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({success:true,targets:sortedTargets.map((target)=>({url:target.url,value:target.value}))}));
           
          }else{
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify( {success:false,error:"Rejected"}));
  
          }
         
      }else{
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify( {success:false,error:"Rejected"}));
      }
     
     } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({success:false,error:error?.message}));
     }
    }
      
      break;
   
    default:
      break;
   }
})

module.exports = function createServer () {
  return http.createServer(cors(handler))
}

function handler (req, res) {
  if (req.url === '/health') return health(req, res)
  req.id = cuid()
  logger(req, res, { requestId: req.id }, function (info) {
    info.authEmail = (req.auth || {}).email
    console.log(info)
  })
  router(req, res, { query: getQuery(req.url) }, onError.bind(null, req, res))
}

function onError (req, res, err) {
  if (!err) return

  res.statusCode = err.statusCode || 500
  logError(req, res, err)

  sendJson(req, res, {
    error: err.message || http.STATUS_CODES[res.statusCode]
  })
}

function logError (req, res, err) {
  if (process.env.NODE_ENV === 'test') return

  var logType = res.statusCode >= 500 ? 'error' : 'warn'

  console[logType]({
    err: err,
    requestId: req.id,
    statusCode: res.statusCode
  }, err.message)
}

function empty (req, res) {
  res.writeHead(204)
  res.end()
}

function getQuery (url) {
  return URL.parse(url, true).query // eslint-disable-line
}
