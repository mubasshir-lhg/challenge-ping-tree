const redisClient=require("../lib/redis")

const getTargets=async()=>JSON.parse(await redisClient.get("TARGETS"))||[];


const getTargetById=async (targetId)=>{
    try {
    const targets=await getTargets();
    return targets.length?targets.find(({id})=>+targetId===+id):null;
    } catch (error) {
        throw new Error(error)
    }
}

const getUtcHour=(date)=>new Date(date).getUTCHours();


const getUtcDate=(date)=>{
    const utcDate=new Date(date).getUTCDate();
    const utcMonth=new Date(date).getUTCMonth();
    const utcYear=new Date(date).getUTCFullYear();
    return `${utcDate}-${utcMonth}-${utcYear}`
}

const deleteAll=async()=>{
    try {
        await redisClient.flushall();
    } catch (error) {
        console.log(error);
        process.exit(0)
    }
}

module.exports={
    getTargets,
    getTargetById,
    getUtcHour,
    getUtcDate,
    deleteAll
}