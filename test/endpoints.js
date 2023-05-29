process.env.NODE_ENV = 'test'

var test = require('ava')
var request = require('supertest')
var httpServer = require('../index');
const mockData=require("../mock");
const {deleteAll}=require("../utils/common")


test.before(async(t) => {
  console.log("BEFORE")
  await httpServer.close();
  t.context.server = httpServer;
  // await deleteAll();
});


test.after(async()=>{
  await httpServer.close();
})

test.beforeEach(async(t)=>{
  // await deleteAll();
  if(t.title.includes("By Id")){
    console.log("ADDING MATCHING DARA")
    const data=await request(t.context.server)
    .post('/api/targets')
    .send(JSON.stringify(mockData[0]));
    console.log(data.body.statusCode);
  }
})

test('Creating New Target And Should Be Created Successfully!!!', async (t) => {
  const res = await request(t.context.server)
    .post('/api/targets')
    .send(JSON.stringify(mockData[0]));

  t.is(res.statusCode,201,"STATUS CODE MATCHED SUCCESSFULLY!!!");
  t.is(res.body.success,true,"SUCCESS STATUS MATCHED");
  t.is(res.body.target,"OK","TARGET VALUE MATCHED");
});

test('Find Target By Id Successfully!!!', async (t) => {
  const res = await request(t.context.server)
    .get('/api/targets/1');

  t.is(res.statusCode,200,"STATUS CODE MATCHED SUCCESSFULLY!!!");
  t.is(res.body.success,true,"SUCCESS STATUS MATCHED");
  t.truthy(res.body.target);
});

test('Find Target By Id Failed!!!', async (t) => {
  let res;
 try {
  res = await request(t.context.server)
  .get('/api/targets/1');
  t.falsy(res)
 } catch (error) {
  console.log(error)
   t.falsy(res)
 }
});

