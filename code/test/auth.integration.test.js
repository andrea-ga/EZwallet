import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import exp from 'constants';

dotenv.config();
const generateToken = (payload, expirationTime = '1h') => {
  return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime});};
  

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('register', () => {
  afterAll(async () => {
  await User.deleteMany({})
  })
 test("Correct registration", async () => {
    let res = await request(app).post("/api/register").send({
      username: "test",
      email: "test@test.com",
      password : "password"});
    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe("User added successfully");

    let us = await User.findOne({username: "test"});
    expect(us).not.toBeNull();
 })
test("Wrong registration, mail not valid", async () => {
    let res = await request(app).post("/api/register").send({
      username: "test",
      email: "test",
      password : "password"});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Not valid request");
 })
 test("Wrong registration, mail already used", async () => {
    let res = await request(app).post("/api/register").send({
      username: "test",
      email: "test@test.com",
      password : "password"});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("The mail is already used");

 })
  test("Wrong registration, username already used", async () => {
    let res = await request(app).post("/api/register").send({
      username: "test",
      email: "test@te.com",
      password : "password"
    })
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("The username is already used");
})


})
describe("registerAdmin", () => { 
  afterAll(async () => {
    await User.deleteMany({})
    })
  test("Correct registration", async () => {
    let res = await request(app).post("/api/admin").send({
      username: "test",
      email: "test@test.com",
      password : "password"});
    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe("User added successfully");

    let us = await User.findOne({username: "test"});
    expect(us).not.toBeNull();
 })
test("Wrong registration, mail not valid", async () => {
    let res = await request(app).post("/api/admin").send({
      username: "test",
      email: "test",
      password : "password"});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Not valid request");
 })
 test("Wrong registration, mail already used", async () => {
    let res = await request(app).post("/api/admin").send({
      username: "test",
      email: "test@test.com",
      password : "password"});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("The mail is already used");

 })
  test("Wrong registration, username already used", async () => {
    let res = await request(app).post("/api/admin").send({
      username: "test",
      email: "test@te.com",
      password : "password"
    })
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("The username is already used");
})

});


describe('login', () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

  beforeAll(async () => {
    for (const c of list_of_users)
    { let pwd = await bcrypt.hash(c.password, 8)
      c.password = pwd
      await User.create( c )}
  })
afterAll(async () => {
  await User.deleteMany({})
})
  test("Correct login regular user", async () => {
    let res = await request(app).post("/api/login").send({
      email: "test@test.com",
      password : "tester"});
      console.log(res.body.error)
    expect(res.statusCode).toBe(200);
    
    let av= jwt.verify(res.body.data.accessToken, process.env.ACCESS_KEY)
    expect(av.username).toBe("tester");
    let rv= jwt.verify(res.body.data.refreshToken, process.env.ACCESS_KEY)
    expect(rv.username).toBe("tester");
});
test("No pwd", async () => {
  let res = await request(app).post("/api/login").send({
    email: "test@test.com",
    password : ""});
   
  expect(res.statusCode).toBe(400)
  expect(res.body.error).toBe("Not valid request");
});
test("No mail", async () => {
  let res = await request(app).post("/api/login").send({
    email: "",
    password : "tester"});
    
  expect(res.statusCode).toBe(400)
  expect(res.body.error).toBe("Not valid request");})

test("Not registered yet", async () => {

    let res = await request(app).post("/api/login").send({
      email: "pack@test.com",
      password : "tester"});
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe("User not registered yet");
  })
  test("Wrong pwd", async () => {
    let res = await request(app).post("/api/login").send({
      email: "test@test.com",
      password : "pwpw"});
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe("wrong credentials");
  })
  test("Email wrong format", async () => {

    let res = await request(app).post("/api/login").send({
      email: "t_e-st@.com",
      password : "tester"});
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe("Not valid request");
  })

})

describe('logout', () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

  beforeAll(async () => {
    await User.deleteMany({})
    for (const c of list_of_users)
    { let pwd = await bcrypt.hash(c.password, 8)
      c.password = pwd
      await User.create( c )}
  })
  test("Correct logout after login", async () => {
    let res = await request(app).post("/api/login").send({
      email: "test@test.com",
      password : "tester"});
      console.log(res.body.error)
    expect(res.statusCode).toBe(200);
    
    let av= jwt.verify(res.body.data.accessToken, process.env.ACCESS_KEY)
    expect(av.username).toBe("tester");
    let rv= jwt.verify(res.body.data.refreshToken, process.env.ACCESS_KEY)
    expect(rv.username).toBe("tester");

  res = await request(app).get("/api/logout").set("Cookie" , "accessToken=" + generateToken(list_of_users[2],'1h')+"; refreshToken=" + generateToken(list_of_users[2],'1h'))
  expect(res.statusCode).toBe(200);
  expect(res.body.data.message).toBe("logged out");
});
   test("Unauthorized logout", async () => {
    let res = await request(app).get("/api/logout")
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  })

});
