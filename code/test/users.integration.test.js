import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose, { Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Cookies from 'js-cookie';
import e from 'express';

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await User.deleteMany({});
await  Group.deleteMany({});
await transactions.deleteMany({});
await categories.deleteMany({});
});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

const generateToken = (payload, expirationTime = '1h') => {
return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime});};


describe("getUsers", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

  beforeAll(async () => {
    for (const c of list_of_users)
    { await User.create( c )}
  })
  afterAll(async () => {
    await User.deleteMany({}) 
  })
 
  test("should return Unauthorized", async () => {
    let res = await request(app).get("/api/users").set("Cookie" , "accessToken=" + generateToken(list_of_users[1],'1h')+"; refreshToken=" + generateToken(list_of_users[1],'1h'))
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Unauthorized");
    })

    test("should all users", async () => {
      let res = await request(app).get("/api/users").set("Cookie" , "accessToken=" + generateToken(list_of_users[2],'1h')+"; refreshToken=" + generateToken(list_of_users[2],'1h'))
      expect(res.status).toBe(200)
      expect(res.body.data[0]).toStrictEqual({username : list_of_users[0].username, email : list_of_users[0].email, role : list_of_users[0].role});
      expect(res.body.data[1]).toStrictEqual({username : list_of_users[1].username, email : list_of_users[1].email, role : list_of_users[1].role});
      expect(res.body.data[2]).toStrictEqual({username : list_of_users[2].username, email : list_of_users[2].email, role : list_of_users[2].role});
      }) 
})

describe("getUser", () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

  beforeAll(async () => {
    for (const c of list_of_users)
    { await User.create( c )}
  })

afterAll(async () => {
  await User.deleteMany({})
})
 
  test("User try to take info of another user", async () => {
    let res = await request(app).get(`/api/users/${list_of_users[0].username}`)
        .set("Cookie" , "accessToken=" + generateToken(list_of_users[1],'1h')+"; refreshToken=" + generateToken(list_of_users[1],'1h'))
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Unauthorized");
    })
    test("User takes his info", async () => {
      let res = await request(app).get(`/api/users/${list_of_users[0].username}`)
          .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
      expect(res.status).toBe(200)
      expect(res.body.data).toStrictEqual({username : list_of_users[0].username, email : list_of_users[0].email, role : list_of_users[0].role});
    })
    test("Admin takes info of a user", async () => {
      let res = await request(app).get(`/api/users/${list_of_users[1].username}`)
          .set("Cookie" , "accessToken=" + generateToken(list_of_users[2],'1h')+"; refreshToken=" + generateToken(list_of_users[2],'1h'))
      expect(res.status).toBe(200)
      expect(res.body.data).toStrictEqual({username : list_of_users[1].username, email : list_of_users[1].email, role : list_of_users[1].role});
    })


})

describe("createGroup", () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
  {username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
  {username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
  {username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
  {username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
  {username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
  {username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
  {username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}]

  beforeAll(async () => {
    for (const c of list_of_users)
    { await User.create( c )}
  })
  beforeEach(async () => {
    await Group.deleteMany({})
  })
  afterAll(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })
 
test("User creates a group", async () => {

  let res = await request(app).post("/api/groups").send({name : "test_group", memberEmails : [list_of_users[0].email, list_of_users[1].email]})
      .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(200)
  expect(res.body.data).toStrictEqual({group :{name : "test_group", members : [{email :list_of_users[0].email},{email : list_of_users[1].email}]} ,membersNotFound : [], alreadyInGroup : []});
})

test("User creates a group with mails has a wrong format", async () => {
 
  let res = await request(app).post("/api/groups").send({name : "test_group", memberEmails : [list_of_users[0].email, "cia0"]})
      .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Invalid email format");
})

test("User create a group with all members not found" , async () => {
  
  let res = await request(app).post("/api/groups").send({name : "test_group", memberEmails : ["ciao@mail.com", "cicic@mail.com"]})
  .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("the `memberEmails` either do not exist or are already in a group");
})
test("User create a group with only the creator present" , async () => {
  
  let res = await request(app).post("/api/groups").send({name : "test_group", memberEmails : ["ciao@mail.com", "cicic@mail.com",list_of_users[0].email]})
  .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(200)
  expect(res.body.data).toStrictEqual({group : { name : "test_group", members : [{email : list_of_users[0].email}]}, membersNotFound : [{email : "ciao@mail.com"},{email :"cicic@mail.com"}], alreadyInGroup : []});
})
test("User create a group with a wrong name" , async () => {  
  
  let res = await request(app).post("/api/groups").send({name : "", memberEmails : [list_of_users[0].email, list_of_users[1].email]})
  .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Invalid request");
})
test("User create a group with a name already taken" , async () => {  
  
  await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
  let res = await request(app).post("/api/groups").send({name : "test_group", memberEmails : [list_of_users[0].email, list_of_users[1].email]})
  .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Group with the same name already exist");
})
test("Cookie not present" , async () => {

  let res = await request(app).post("/api/groups").send({name : "test_group", memberEmails : []})
  expect(res.status).toBe(401)
  expect(res.body.error).toBe("Unauthorized");
})
test("Group creator already in a group" , async () => { 
  
  await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
  let res = await request(app).post("/api/groups").send({name : "test_group2", memberEmails : [list_of_users[0].email, list_of_users[1].email]})
  .set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'))
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("User creator already present in a group");
})
test("User creates a group with all members already in a group", async () => {  
  await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
  let res = await request(app).post("/api/groups").send({name : "test_group2", memberEmails : [list_of_users[0].email, list_of_users[1].email]})
  .set("Cookie" , "accessToken=" + generateToken(list_of_users[2],'1h')+"; refreshToken=" + generateToken(list_of_users[2],'1h'))
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("the `memberEmails` either do not exist or are already in a group"); 
})

})

describe("getGroups", () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
  {username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
  {username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
  {username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
  {username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
  {username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
  {username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
  {username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}]

  
  beforeAll(async () => {
    for (const c of list_of_users)
    { await User.create( c )};
    await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
    await Group.create({name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]})
    await Group.create({name : "test_group3", members : [{email :list_of_users[4].email}, {email :list_of_users[5].email}]})
  
  });
   afterAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   });

test("Admin get all groups", async () => {
  
  let res = await request(app).get("/api/groups").set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(200) 
  expect(res.body).toStrictEqual({data :
    [{name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]},
     {name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]}, 
     {name : "test_group3", members : [{email :list_of_users[4].email}, {email :list_of_users[5].email}]
    }]
  })
})
test("No admin cookie", async () => {
  let res = await request(app).get("/api/groups").set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));
  expect(res.status).toBe(401) 
  expect(res.body.error).toBe("Unauthorized")
})

})

describe("getGroup", () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
  {username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
  {username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
  {username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
  {username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
  {username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
  {username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
  {username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}];

  beforeAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   for (const c of list_of_users)
    { await User.create( c )}
    await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
    await Group.create({name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]})
    await Group.create({name : "test_group3", members : [{email :list_of_users[4].email}, {email :list_of_users[5].email}]})
  });
  afterAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   });


test("Admin get group", async () => {
    let gr = "test_group"
    let res = await request(app).get(`/api/groups/${gr}`).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
    expect(res.status).toBe(200) 
    expect(res.body).toStrictEqual({data : {group: {name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]}}})
  })
  test("No admin cookie", async () => { 
    let gr = "test_group"
    let res = await request(app).get(`/api/groups/${gr}`);
    expect(res.status).toBe(401) 
    expect(res.body.error).toBe("Unauthorized")
  })
  test("No group found", async () => {
    let gr = "test_group4"
    let res = await request(app).get(`/api/groups/${gr}`).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
    expect(res.status).toBe(400) 
    expect(res.body.error).toBe("Group not found")
  })
  test("Group found and user present in members", async () => {
    let gr = "test_group"
    let res = await request(app).get(`/api/groups/${gr}`).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));
    expect(res.status).toBe(200) 
    expect(res.body).toStrictEqual({data :{group : {name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]}}})
  })
  test("Group found and user not present in members", async () => {
    let gr = "test_group"
    let res = await request(app).get(`/api/groups/${gr}`).set("Cookie" , "accessToken=" + generateToken(list_of_users[6],'1h')+"; refreshToken=" + generateToken(list_of_users[6],'1h'));
    expect(res.status).toBe(401) 
    expect(res.body.error).toBe("Unauthorized")
  })
})

describe("addToGroup", () => { 

  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
  {username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
  {username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
  {username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
  {username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
  {username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
  {username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
  {username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}]

//admin use path /api/groups/:name/insert
//user use path /api/groups/:name/add
beforeAll(async () => {
  for (const c of list_of_users)
    { await User.create( c )}});
  beforeEach(async () => {
    await Group.deleteMany({});
    await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
    await Group.create({name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]})
  });
  afterAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   });
test("Admin add user to group", async () => {
  let group = "test_group"
  let res = await request(app).patch(`/api/groups/${group}/insert`).send({emails : [list_of_users[4].email]}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(200)
  expect(res.body).toStrictEqual({data :{group :{name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}, {email :list_of_users[4].email}]}, alreadyInGroup : [], membersNotFound : []}});

  //let group2 = await Group.findOne({name : "test_group"})
  //console.log(group2) 
})
  test("Admin add user to group with some users already in the group", async () => {
    let group = "test_group"
    let res = await request(app).patch(`/api/groups/${group}/insert`).send({emails : [list_of_users[0].email]}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
    expect(res.status).toBe(400)
    expect(res.body).toStrictEqual({error : "All emails wrong or already used"})
  })

  test("Admin add user to group with some users already in the group", async () => {
    let group = "test_group"
    let res = await request(app).patch(`/api/groups/${group}/insert`).send({emails : [list_of_users[0].email, list_of_users[5].email]}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
    expect(res.status).toBe(200)
    expect(res.body).toStrictEqual({data :{group :{name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}, {email :list_of_users[5].email}]}, alreadyInGroup : [{email :list_of_users[0].email}], membersNotFound : []}});

  })

  test("User try to add an user to a group where he is not enrolled", async () => {
  let group = "test_group2"
  let res = await request(app).patch(`/api/groups/${group}/add`).send({emails : [list_of_users[4].email]}).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));

  expect(res.status).toBe(401)
  expect(res.body).toStrictEqual({error : "Unauthorized"})
  })

  test("User try to add an user to a group where he is enrolled", async () => {
    let group = "test_group"
    let res = await request(app).patch(`/api/groups/${group}/add`).send({emails : [list_of_users[4].email]}).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));

    expect(res.status).toBe(200)
    expect(res.body).toStrictEqual({data :{group :{name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}, {email :list_of_users[4].email}]}, alreadyInGroup : [], membersNotFound : []}});
  })

  test("wrong request format, no field emails", async() => {
    let group = "test_group"
    let res = await request(app).patch(`/api/groups/${group}/add`).send({}).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));

    expect(res.status).toBe(400)
    expect(res.body).toStrictEqual({error : "Bad request"})
  }
  )
  test("No cookie", async() => {
    let group = "test_group"
    let res = await request(app).patch(`/api/groups/${group}/add`).send({emails : [list_of_users[4].email]});

    expect(res.status).toBe(401)
    expect(res.body).toStrictEqual({error : "Unauthorized"})
  })
  test("Group not found " , async() => {
    let group = "test_group3"
    let res = await request(app).patch(`/api/groups/${group}/add`).send({emails : [list_of_users[4].email]}).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));

    expect(res.status).toBe(400)
    expect(res.body).toStrictEqual({error : "Group not found"})
  })
})

describe("removeFromGroup", () => {
//the admin use the path api/groups/:name/pull
//the user use the path api/groups/:name/remove
let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
{username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
{username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
{username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
{username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
{username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
{username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
{username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
{username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
{username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}];

beforeAll(async () => {
 for (const c of list_of_users)
  { await User.create( c )}
});
beforeEach(async () => {
  await Group.deleteMany({});
  await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
  await Group.create({name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]})
  await Group.create({name : "test_group3", members : [{email :list_of_users[4].email}, {email :list_of_users[5].email}]})
  await Group.create({name : "test_group4", members : [{email :list_of_users[7].email}]})
});
 afterAll(async () => {
  await Group.deleteMany({});
  await User.deleteMany({});
 });

 test("Admin remove user from group of one memeber", async () => {
  
  let gr = "test_group4"  
  let email = [list_of_users[7].email]
  let res = await request(app).patch(`/api/groups/${gr}/pull`).send({ emails : email}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Group contains only one member")
})
test("Admin remove user from group", async () => {
  let gr = "test_group"
  let email = [list_of_users[0].email, list_of_users[1].email]
  let res = await request(app).patch(`/api/groups/${gr}/pull`).send({ emails : email}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(200)
  expect(res.body).toStrictEqual({data : {group: {name : "test_group", members : [{email :list_of_users[0].email}]},  membersNotFound : [],notInGroup : []}})

 })
test("User try to remove user from group without being authorized", async () => {
  let gr = "test_group"
  let email = [list_of_users[0].email, list_of_users[1].email]
  let res = await request(app).patch(`/api/groups/${gr}/remove`).send({ emails : email}).set("Cookie" , "accessToken=" + generateToken(list_of_users[6],'1h')+"; refreshToken=" + generateToken(list_of_users[6],'1h'));
  expect(res.status).toBe(401)
  expect(res.body.error).toBe("Unauthorized")
})
 test("User try to remove user from group where he is enrolled", async () => {
  let gr = "test_group"
  let email = [list_of_users[1].email]
  let res = await request(app).patch(`/api/groups/${gr}/remove`).send({ emails : email}).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h'));
  expect(res.status).toBe(200)
  expect(res.body).toStrictEqual({data : {group: {name : "test_group", members : [{email :list_of_users[0].email}]},  membersNotFound : [],notInGroup : []}})
})
test("Bad request", async () => {
  let gr = "test_group"
  let res = await request(app).patch(`/api/groups/${gr}/remove`).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h')); 
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Bad request")
})
test("Admin try to remove user that not exist from group", async () => {  
  let gr = "test_group"
  let email = ["no@no.com"]
  let res = await request(app).patch(`/api/groups/${gr}/pull`).send({ emails : email}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("all the `memberEmails` either do not exist or are not in the group")
})

})

describe("deleteUser", () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
  {username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
  {username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
  {username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
  {username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
  {username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
  {username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
  {username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}];

  beforeAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   for (const c of list_of_users)
    { await User.create( c )}
    await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
    await Group.create({name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]})
    await Group.create({name : "test_group3", members : [{email :list_of_users[4].email}, {email :list_of_users[5].email}]})
    await Group.create({name : "test_group4", members : [{email :list_of_users[7].email}]})
  });
   afterAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   });


   test("request body email is not present", async () => {
    let res = await request(app).delete(`/api/users`).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Bad request")
  })
  test("User try to delete another user", async () => { 
    let res = await request(app).delete(`/api/users`).set("Cookie" , "accessToken=" + generateToken(list_of_users[0],'1h')+"; refreshToken=" + generateToken(list_of_users[0],'1h')).send({email : list_of_users[1].email});
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Unauthorized")
  })
  test("Admin delete another user", async () => {
    await transactions.create({username : list_of_users[3].username, type : "sport", amount : 100, date : new Date()})
    let res = await request(app).delete(`/api/users`).set("Cookie" , "accessToken=" + generateToken(list_of_users[2],'1h')+"; refreshToken=" + generateToken(list_of_users[2],'1h')).send({email : list_of_users[3].email});
    expect(res.status).toBe(200)
    expect(res.body).toStrictEqual({ data: { deletedTransactions: 1, removedFromGroup: true } })
  })
 test("Admin try to delete another admin", async() => {
  let res = await request(app).delete(`/api/users`).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h')).send({email : list_of_users[2].email});
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Admin can't be removed")
 })

test("Admin delete another user that the only member of a group", async () => {
    let res = await request(app).delete(`/api/users`).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h')).send({email : list_of_users[7].email});
    expect(res.status).toBe(200)
    expect(res.body).toStrictEqual({ data: { deletedTransactions: 0, removedFromGroup: true } })
    let present = await Group.findOne({name : "test_group4"})
    expect(present).toBeNull()
    let present2 = await User.findOne({email : list_of_users[7].email})
    expect(present2).toBeNull()
  })
})

describe("deleteGroup", () => { 
  let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
  {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
  {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
  {username: "tester4", email: "tes4@test.com", password: "tester4", role: "Regular"},
  {username: "tester5", email: "tes5@test.com", password: "tester5", role: "Admin"},
  {username: "tester6", email: "tes6@test.com", password: "tester6", role: "Regular"},
  {username: "tester7", email: "tes7@test.com", password: "tester7", role: "Regular"},
  {username: "tester8", email: "tes8@test.com", password: "tester8", role: "Regular"},
  {username: "tester9", email: "test9@test.com", password: "tester9", role: "Regular"},
  {username: "tester10", email: "test10@test.com", password: "tester10", role: "Regular"}];

  beforeAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   for (const c of list_of_users)
    { await User.create( c )}
    await Group.create({name : "test_group", members : [{email :list_of_users[0].email}, {email :list_of_users[1].email}]})
    await Group.create({name : "test_group2", members : [{email :list_of_users[2].email}, {email :list_of_users[3].email}]})
    await Group.create({name : "test_group3", members : [{email :list_of_users[4].email}, {email :list_of_users[5].email}]})
  });
   afterAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
   });

test("Admin delete group", async () => {
    let gr = "test_group"
    let res = await request(app).delete(`/api/groups`).send({name: gr}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
    expect(res.status).toBe(200) 
    expect(res.body).toStrictEqual({data : {message : "Group deleted successfully"}})
  })
  test("No admin cookie", async () => { 
    let gr = "test_group"
    let res = await request(app).delete(`/api/groups`).send({name: gr}).set("Cookie" , "accessToken=" + generateToken(list_of_users[3],'1h')+"; refreshToken=" + generateToken(list_of_users[3],'1h'));
    expect(res.status).toBe(401) 
    expect(res.body.error).toBe("Unauthorized")
  })
test("No group found", async () => { 
  let gr = "test_group4"  
  let res = await request(app).delete(`/api/groups`).send({name: gr}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Group not found") 
})
test("req error", async () => {
  let res = await request(app).delete(`/api/groups`).send({name: ""}).set("Cookie" , "accessToken=" + generateToken(list_of_users[4],'1h')+"; refreshToken=" + generateToken(list_of_users[4],'1h'));
  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Bad request")
})

})
