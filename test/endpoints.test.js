const request = require('supertest')
const app = require('../index');
const {deleteAll}=require("../utils/common");
const mockData=require("../utils/mock")


beforeAll(async() => {
   await deleteAll();
});

afterAll(async() => {
  await deleteAll();
  await app.close();
});


describe('Test For Create Targets', () => {
 
  it('Creating New Target And Should Be Created Successfully!!!', async () => {
    const res = await request(app)
      .post('/api/targets')
      .send(mockData[0])
    expect(res.statusCode).toEqual(201)
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(true)
  });


  it("Creating New Target And Should Be Created Successfully But In Response success shouldn't be as false", async () => {
    const res = await request(app)
      .post('/api/targets')
      .send(mockData[1])
    expect(res.statusCode).toEqual(201)
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).not.toBe(false)
  });

});


describe("Testing Get Target By Id",()=>{

  beforeAll(async() => {
    await deleteAll();
    await request(app)
    .post('/api/targets')
    .send(mockData[0])
  });

  it("Find Target By Id Successfully!!!",async ()=>{
    const res=await request(app)
    .get('/api/targets/1')
    .send();

    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(true);
    expect(res.body.target).toBeTruthy();
  });

  it("Find Target By Id Shouldn't Be Able To Find",async ()=>{
    const res=await request(app)
    .get('/api/targets/2')
    .send();

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(false);
  });
  
});





describe("Check For Max Attempt For Request",()=>{

  beforeAll(async() => {
    await deleteAll();
    console.log("Inserting data into redis so that we can check for getting target by id")
    await request(app)
    .post('/api/targets')
    .send(mockData[0])
  });


  it("Checking For Max Request Per Day Successful!!!",async ()=>{
    const res=await request(app)
    .post('/api/targets/1')
    .send({
      timestamps:"5-27-2023"
    });

    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(true);
  });

  it("Checking For Max Request Per Day To Be Limit Reached!!!",async ()=>{
    const res=await request(app)
    .get('/api/targets/2')
    .send();

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(false);
  });

})


describe("Get All Targets",()=>{

  beforeAll(async() => {
    await deleteAll();
    await request(app)
    .post('/api/targets')
    .send(mockData[0])});

  it("Getting Targets With Success",async ()=>{
    const res=await request(app)
    .get('/api/targets');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('targets');
    expect(res.body.success).toBe(true);
  });


  it("Getting Targets With Fail",async ()=>{
    const res=await request(app)
    .get('/api/targets');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('targets');
    expect(res.body.success).toBe(true);
    expect(res.body.targets.length).not.toBe(2)
  });

});




describe("Get Decision",()=>{

  beforeAll(async() => {
    await deleteAll();
    await request(app)
    .post('/api/targets')
    .send(mockData[0])

    await request(app)
    .post('/api/targets')
    .send(mockData[1])
  });

  it("Get Decision With Success",async ()=>{
    const res=await request(app)
    .post('/route')
    .send({
      "geoState": "ca",
      "publisher": "abc",
      "timestamp": "2018-07-19T13:28:59.513Z"
 });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('targets');
    expect(res.body.success).toBe(true);
  });


  it("Get Decision With Fail",async ()=>{
    const res=await request(app)
    .post('/route')
    .send({
      "geoState": "ca",
      "publisher": "abc",
      "timestamp": "2018-07-19T18:28:59.513Z"
 });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('error');
    expect(res.body.success).toBe(false);
    expect(res.body.error).toEqual("Rejected");
  });

})



