const redisClient=require("../lib/redis");
const {getTargets:redisGetTargets,getTargetById:redisGetTargetById,getUtcDate, getUtcHour}=require("../utils/common")


exports.createTarget=async(req,res)=>{
    try {
        const targets=await redisGetTargets();
        const target=await redisClient.set("TARGETS",JSON.stringify([req.body,...targets]));
        return res.status(201).json({
            success:true,
            target
        });
       
    } catch (error) {
        return res.status(400).json({
            success:false,
            error
        })
    }
}

exports.getTargetById=async (req,res)=>{
    try {
        const target=await redisGetTargetById(req.params.id);
        return res.status(target?200:404).json({
            success:Boolean(target),
            target
        })
    } catch (error) {
        return res.status(400).json({
            success:false,
            error
        })
    }
}

exports.getAllTargets=async(req,res)=>{
    try {
        const targets=await redisGetTargets();
        return res.status(200).json({
            success:true,
            targets
        });
       
    } catch (error) {
        return res.status(400).json({
            success:false,
            error
        })
    }
}

exports.updateTargetMaxAttempts=async (req,res)=>{
try {
    const target=await redisGetTargetById(req.params.id);
    if(!target){
        return res.status(404).json({
            success:false,
            error:"No target found"
        })
    }else{
        const score=JSON.parse(await redisClient.get("SCORE"));
        const utcDate= getUtcDate(new Date(req.body.timestamps));

        if(!score){
            await redisClient.set("SCORE",JSON.stringify({[utcDate]:{[req.params.id]:1}}))
        }else{
          const scoreDateObj=score[utcDate];
            if(!scoreDateObj){
                console.log("IF WE DON'T HAVE DATE OBJ IN SCORE")
                score[utcDate]={
                    [req.params.id]:1
                }
            await redisClient.set("SCORE",JSON.stringify(score))

            }else{
                console.log("IF WE DO HAVE DATE IN SCORE OBJECT")
                if(scoreDateObj[req.params.id]){
                    console.log("IF WE DON HAVE DATE AND ALSO ID OF TARGET THAN INCREASE NUMBER OF ATTEMPTS")
                    scoreDateObj[req.params.id]+=1;
                    if(scoreDateObj[req.params.id]>target["maxAcceptsPerDay"]*1){
                          throw new Error("Limit exceeded")
                    }
                }
                else{
                    console.log("IF WE DON HAVE DATE BUT NOT ID OF TARGET THAN SET ATTEMP AS 1")
                    scoreDateObj[req.params.id]={
                        [req.params.id]:1
                    }
                }
                await redisClient.set("SCORE",JSON.stringify(score))
            }
        }

        return res.status(200).json({
            success:true
        });
    }
   
} catch (error) {
    return res.status(400).json({
        success:false,
        error:error?.message
    })
}
}


exports.getDecision=async (req,res)=>{
    try {
        const {geoState:userGeoState,timestamp}=req.body;
        const utcHour=getUtcHour(timestamp);
        const targets=await redisGetTargets();
        if(targets.length){
            const targetWithGeoState=targets.filter((target)=>target["accept"]["geoState"]["$in"].indexOf(userGeoState)>=0&&target["accept"]["hour"]["$in"].indexOf(utcHour)>=0);
            if(targetWithGeoState.length){
                const sortedTargets=targetWithGeoState.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
                return res.status(200).json({
                    success:true,
                    targets:sortedTargets.map((target)=>({url:target.url}))
                })
            }else{
                return res.status(400).json({
                    success:false,
                    error:"Rejected"
                });
            }
           
        }else{
            return res.status(400).json({
                success:false,
                error:"Rejected"
            });
        }
    } catch (error) {
        return res.status(400).json({
            success:false,
            error:error?.message
        })
    }
}