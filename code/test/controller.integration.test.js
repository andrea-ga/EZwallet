import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import {verifyAuth} from "../controllers/utils.js";
import {
    createCategory,
    createTransaction,
    getAllTransactions,
    getCategories, getTransactionsByGroup, getTransactionsByGroupByCategory,
    getTransactionsByUserByCategory
} from "../controllers/controller.js";
import {User, Group} from "../models/User.js";

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
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

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

const generateToken = (payload, expirationTime = '1h') => {
    return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime});
};


describe("createCategory", () => {
    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        for (const c of list_of_users)
        { await User.create( c )}
    })
    beforeEach(async () => {
        await categories.deleteMany({})
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
    })

    test('should return the new category', async () => {
        const res = await request(app).post('/api/categories').send({type: "type1", color: "color1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") +
                "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual({type: "type1", color: "color1"});
    });

    test('Unauthorized access', async () => {
        const res = await request(app).post('/api/categories').send({type: "type1", color: "color1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    });

    test('empty type field', async () => {
        const res = await request(app).post('/api/categories').send({type: "", color: ""})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") +
                "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("type field is empty");
    });

    test('empty color field', async () => {
        const res = await request(app).post('/api/categories').send({type: "type1", color: ""})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") +
                "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("color field is empty");
    });

    test('type already present', async () => {
        await request(app).post('/api/categories').send({type: "type1", color: "color1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") +
                "; refreshToken=" + generateToken(list_of_users[1], "1h"));
        const res = await request(app).post('/api/categories').send({type: "type1", color: "color2"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") +
                "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("type already present");
    });
})

describe("updateCategory", () => { 
    let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
    {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
    {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

    beforeAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({})
        for (const c of list_of_users)
        { await User.create( c )}
        await categories.create({type: "type1", color: "color1"})
        await categories.create({type: "type2", color: "color2"})
        await categories.create({type: "type3", color: "color3"})
        await categories.create({type: "type4", color: "color4"})
        await transactions.create({username: "tester", amount: 10, type: "type1", date : new Date("2021-01-01")})
        await transactions.create({username: "tester", amount: 11, type: "type2", date : new Date("2021-01-02")})
        await transactions.create({username: "tester", amount: 12, type: "type3", date : new Date("2021-01-03")})
        await transactions.create({username: "tester", amount: 13, type: "type4", date : new Date("2021-01-04")})
        await transactions.create({username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
        await transactions.create({username: "tester2", amount: 17, type: "type3", date : new Date("2021-01-08")})
        await transactions.create({username: "tester3",amount: 18, type: "type4", date : new Date("2021-01-09")}) 
    })
    afterAll(async () => {
        await categories.deleteMany({})
        await transactions.deleteMany({})
        await User.deleteMany({})
    })


    test("User unauthorized", async () => {
        let type1 = "type1"
        let res = await request(app).patch(`/api/categories/${type1}`).send({type: "type1", color: "color1"}).set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized")
    })

    test("Category not found", async () => {
     let new_type = "type6"
        let res = await request(app).patch(`/api/categories/${new_type}`).send({type: "type6", color: "color6"}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("Category not found")
    })

    test("Category already present", async () => {
        let type1 = "type1"
        let type2 = "type2"
        let res = await request(app).patch(`/api/categories/${type1}`).send({type: type2, color: "color1"}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("Category already present")
    })

    test("Update category", async () => {
        let type1 = "type1"
        let res = await request(app).patch(`/api/categories/${type1}`).send({type: "Type1", color: "color6"}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));

        
        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({data : {message : "Category updated successfully", count : 2}})
        let new_transactions = await transactions.find({type: "Type1"})
        expect(new_transactions.length).toStrictEqual(2)
        let find_category = await categories.findOne({type: "Type1"})
        expect(find_category).not.toBe(null)
    })
})

describe("deleteCategory", () => { 
    let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
    {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
    {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

    beforeAll(async () => {
        await categories.deleteMany({})
        await transactions.deleteMany({})
        await User.deleteMany({})
        for (const c of list_of_users)
        { await User.create( c )}
        await categories.create({type: "type1", color: "color1"})
        await categories.create({type: "type2", color: "color2"})
        await categories.create({type: "type3", color: "color3"})
        await categories.create({type: "type4", color: "color4"})
        await categories.create({type: "type5", color: "color5"})
        await transactions.create({username: "tester", amount: 10, type: "type1", date : new Date("2021-01-01")})
        await transactions.create({username: "tester", amount: 11, type: "type2", date : new Date("2021-01-02")})
        await transactions.create({username: "tester", amount: 12, type: "type3", date : new Date("2021-01-03")})
        await transactions.create({username: "tester", amount: 13, type: "type4", date : new Date("2021-01-04")})
        await transactions.create({username: "tester", amount: 14, type: "type5", date : new Date("2021-01-05")})
        await transactions.create({username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
        await transactions.create({username: "tester2", amount: 17, type: "type3", date : new Date("2021-01-08")})
        await transactions.create({username: "tester3",amount: 18, type: "type4", date : new Date("2021-01-09")}) 
    })
    afterAll(async () => {
        await categories.deleteMany({})
        await transactions.deleteMany({})
        await User.deleteMany({})
    })

  //only the admin can access this route and the error is 401 Unauthorized, if the request body is wrong the error is 400
  //if there is a least one categories that not exist in the req.body.types the error is 400
  //if types.length is 0 the error is 400
  //if types.length is > number of categories the error is 400

    test("User unauthorized", async () => {
        let res = await request(app).delete("/api/categories").send({types: ["type1", "type2"]}).set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"));
        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized")
    })

    test("Request body wrong", async () => {
        let res = await request(app).delete("/api/categories").send({type: ["type1", "type2"]}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("Invalid request")
    })
    test("Types is empty", async () => {
        let res = await request(app).delete("/api/categories").send({types: []}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("Invalid request")
    })
    test("Types include an empty string", async () => {
        let res = await request(app).delete("/api/categories").send({types: ["type1", ""]}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("Invalid request")
    })

    test("We have 5 category and try to delete 6 category", async () => {
        let res = await request(app).delete("/api/categories").send({types: ["type1", "type2", "type3", "type4", "type5", "type6"]}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("Cannot delete more categories than the ones present")
    })

    test("Try to delete all categories", async () => {
        let res = await request(app).delete("/api/categories").send({types: ["type1", "type2", "type3", "type4", "type5"]}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({data : {message : "Categories deleted", count : 4}})

        let c1 = await categories.findOne({type: "type1"})
        let c2 = await categories.findOne({type: "type2"})
        let c3 = await categories.findOne({type: "type3"})
        let c4 = await categories.findOne({type: "type4"})
        let c5 = await categories.findOne({type: "type5"})
        expect(c1).not.toBeNull()
        expect(c2).toBeNull()
        expect(c3).toBeNull()
        expect(c4).toBeNull()
        expect(c5).toBeNull()

        let transactions1 = await transactions.find({type: "type1"})
        let transactions2 = await transactions.find({type: "type2"})
        let transactions3 = await transactions.find({type: "type3"})    
        let transactions4 = await transactions.find({type: "type4"})
        let transactions5 = await transactions.find({type: "type5"})
        expect(transactions1.length).not.toBe(0)
        expect(transactions2.length).toBe(0)
        expect(transactions3.length).toBe(0)
        expect(transactions4.length).toBe(0)
        expect(transactions5.length).toBe(0)

        await categories.deleteMany({})
        await transactions.deleteMany({})
        await categories.create({type: "type1", color: "color1"})
        await categories.create({type: "type2", color: "color2"})
        await categories.create({type: "type3", color: "color3"})
        await categories.create({type: "type4", color: "color4"})
        await categories.create({type: "type5", color: "color5"})
        await transactions.create({username: "tester", amount: 10, type: "type1", date : new Date("2021-01-01")})
        await transactions.create({username: "tester", amount: 11, type: "type2", date : new Date("2021-01-02")})
        await transactions.create({username: "tester", amount: 12, type: "type3", date : new Date("2021-01-03")})
        await transactions.create({username: "tester", amount: 13, type: "type4", date : new Date("2021-01-04")})
        await transactions.create({username: "tester", amount: 14, type: "type5", date : new Date("2021-01-05")})
        await transactions.create({username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
        await transactions.create({username: "tester2", amount: 17, type: "type3", date : new Date("2021-01-08")})
        await transactions.create({username: "tester3",amount: 18, type: "type4", date : new Date("2021-01-09")}) 
    
    }
    )

    test("Try to delete 2 categories", async () => {
        let res = await request(app).delete("/api/categories").send({types: ["type1", "type2"]}).set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({data : {message : "Categories deleted", count : 2}})
        let c1 = await categories.findOne({type: "type1"})
        let c2 = await categories.findOne({type: "type2"})
        let c3 = await categories.findOne({type: "type3"})
        expect(c1).toBeNull()
        expect(c2).toBeNull()
        expect(c3).not.toBeNull()
        let transactions1 = await transactions.find({type: "type1"})
        let transactions2 = await transactions.find({type: "type2"})
        let transactions3 = await transactions.find({type: "type3"})
        expect(transactions1.length).toBe(0)
        expect(transactions2.length).toBe(0)
        expect(transactions3.length).not.toBe(0)
    })
})

describe("getCategories", () => {

    const list_of_categories = [{type: "type1", color: "color1"},
        {type: "type2", color: "color2"}, {type: "type3", color: "color3"}, {type: "type4", color: "color4"}];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
    })

    test('should return empty list if there are no categories', async () => {
        await categories.deleteMany({});

        const res = await request(app).get('/api/categories')
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);

        for (const c of list_of_categories)
        {   await categories.create( c )}
    });

    test('should retrieve list of all categories', async () => {
        const res = await request(app).get('/api/categories')
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual(list_of_categories);
    });

    test('Unauthorized access', async () => {
        const res = await request(app).get('/api/categories');

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    });
})

describe("createTransaction", () => {

    const list_of_categories = [{type: "type1", color: "color1"},
        {type: "type2", color: "color2"}, {type: "type3", color: "color3"}, {type: "type4", color: "color4"}];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}
    })
    beforeEach(async () => {
        await transactions.deleteMany({});
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({})
    })

    test('should return the new transaction', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "tester", amount: 10, type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data.username).toStrictEqual("tester");
        expect(res.body.data.amount).toStrictEqual(10);
        expect(res.body.data.type).toStrictEqual("type1");
    });

    test('Unauthorized access', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "tester", amount: 10, type: "type1"});

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    });

    test('empty username field', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "", amount: 10, type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("username field is empty");
    });

    test('empty type field', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "tester", amount: 10, type: ""})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("type field is empty");
    });

    test('amount field is not a number', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "tester", amount: "abc", type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("amount field is not a number");
    });

    test('route param user not found', async () => {
        const nouser = {username: "nouser", email: "nouser@test.com", password: "nouser", role: "Regular"};
        const res = await request(app).post(`/api/users/nouser/transactions`)
            .send({username: "tester", amount: 10, type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(nouser, "1h") +
                "; refreshToken=" + generateToken(nouser, "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("route param user does not exist");
    });

    test('req body user not found', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "nouser", amount: 10, type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("req body user does not exist");
    });

    test('req body user and route param user dont match', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "tester3", amount: 10, type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("req body user and route param user don't match");
    });

    test('category not found', async () => {
        const res = await request(app).post(`/api/users/${list_of_users[0].username}/transactions`)
            .send({username: "tester", amount: 10, type: "type5"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("category does not exist");
    });
})

describe("getAllTransactions", () => {

    const list_of_categories = [{type: "type1", color: "color1"},
        {type: "type2", color: "color2"}, {type: "type3", color: "color3"}, {type: "type4", color: "color4"}];

    const list_of_transactions = [
        {username: "tester", amount: 10, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester3", amount: 20, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2"},
        {username: "tester", amount: 30, type: "type3", date: "2023-05-14T14:27:59.045Z", color: "color3"},
        {username: "tester3", amount: 40, type: "type4", date: "2023-05-14T14:27:59.045Z", color: "color4"}];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_transactions)
        {   await transactions.create( c )}
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({});
    })

    test('should return empty list if there are no transactions', async () => {
        await transactions.deleteMany({});

        const res = await request(app).get(`/api/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);

        for(const t of list_of_transactions)
        {   await transactions.create(t) }
    });

    test('should retrieve list of all transactions', async () => {
        const res = await request(app).get(`/api/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({data : list_of_transactions});
    });

    test('Unauthorized access', async () => {
        const res = await request(app).get(`/api/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    });
})

describe("getTransactionsByUser", () => { 
    let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
    {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
    {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]
    
    beforeAll(async () => {
        for (const c of list_of_users)
        { await User.create( c )}
        await categories.create({type: "type1", color: "color1"})
        await categories.create({type: "type2", color: "color2"})
        await categories.create({type: "type3", color: "color3"})
        await categories.create({type: "type4", color: "color4"})
        await categories.create({type: "type5", color: "color5"})
        await transactions.create({username: "tester", amount: 10, type: "type1", date : new Date("2021-01-01")})
        await transactions.create({username: "tester", amount: 11, type: "type2", date : new Date("2021-01-02")})
        await transactions.create({username: "tester", amount: 12, type: "type3", date : new Date("2021-01-03")})
        await transactions.create({username: "tester", amount: 13, type: "type4", date : new Date("2021-01-04")})
        await transactions.create({username: "tester", amount: 14, type: "type5", date : new Date("2021-01-05")})
        await transactions.create({username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
        await transactions.create({username: "tester2", amount: 17, type: "type3", date : new Date("2021-01-08")})
        await transactions.create({username: "tester3",amount: 18, type: "type4", date : new Date("2021-01-09")}) 
    })
    afterAll(async () => {
        await transactions.deleteMany({})
        await User.deleteMany({})
    })

    test('User search for another user transactions', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") +
                "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    })

    test('User search for his transactions', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(5);

    })
     test('User search for his transactions with date filter', async () => {
     
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?date=2021-01-01`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);

    })

    test('User search for his transactions with amount filter', async () => {
         
            const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?min=10&max=10`)
                .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"));
    
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
    })

    test('User search for his transactions with amount and date filter', async () => {  

        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?min=10&max=10&date=2021-01-01`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
    })

    test('Admin search for another user transactions', async () => {
        const res = await request(app).get(`/api/transactions/users/${list_of_users[0].username}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"));
            expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(5)


    })

    test('No cookie', async () => {
        const res = await request(app).get(`/api/transactions/users/${list_of_users[0].username}`)
        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    })

    test('User search for his transactions with amount and date filter second test', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?min=10&max=13&from=2020-12-31&to=2021-01-04`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"));
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(4)

})

})

describe("getTransactionsByUserByCategory", () => {

    const list_of_categories = [{type: "type1", color: "color1"},
        {type: "type2", color: "color2"}, {type: "type3", color: "color3"}, {type: "type4", color: "color4"}];

    const list_of_transactions = [
        {username: "tester", amount: 10, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 20, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester3", amount: 30, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 40, type: "type4", date: "2023-05-14T14:27:59.045Z", color: "color4"},
        {username: "tester3", amount: 60, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 70, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2"},];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({});
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_transactions)
        {   await transactions.create( c )}
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({});
    })

    test('admin route - should return empty list if there are no transactions for that user and category', async () => {
        await transactions.deleteMany({});

        const res = await request(app)
            .get(`/api/transactions/users/${list_of_users[1].username}/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);

        for(const t of list_of_transactions)
        {   await transactions.create(t) }
    });

    test('admin route - should return list of transactions for that user and category', async () => {
        const res = await request(app)
            .get(`/api/transactions/users/${list_of_users[1].username}/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual(
            [{username: "tester3", amount: 30, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
            {username: "tester3", amount: 60, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"}]);
    });

    test('user route - should return empty list if there are no transactions for that user and category', async () => {
        await transactions.deleteMany({});

        const res = await request(app)
            .get(`/api/users/${list_of_users[0].username}/transactions/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);

        for(const t of list_of_transactions)
        {   await transactions.create(t) }
    });

    test('user route - should return list of transactions for that user and category', async () => {
        const res = await request(app)
            .get(`/api/users/${list_of_users[0].username}/transactions/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual(
            [{username: "tester", amount: 10, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
                {username: "tester", amount: 20, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"}]);
    });

    test('admin route - should return 401 if user is not authorized', async () => {
        const res = await request(app)
            .get(`/api/transactions/users/${list_of_users[0].username}/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    });

    test('user route - should return 401 if user is not authorized', async () => {
        const res = await request(app)
            .get(`/api/users/${list_of_users[0].username}/transactions/category/${list_of_categories[0].type}`);

        expect(res.status).toBe(401);
        expect(res.body.error).toStrictEqual("Unauthorized");
    });

    test('admin route - should return 400 if user does not exist', async () => {
        const nouser = {username: "nouser", email: "nouser@test.com", password: "nouser", role: "Admin"};

        const res = await request(app)
            .get(`/api/transactions/users/nouser/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(nouser, "1h")
                + "; refreshToken=" + generateToken(nouser, "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("user does not exist");
    });

    test('user route - should return 400 if user does not exist', async () => {
        const nouser = {username: "nouser", email: "nouser@test.com", password: "nouser", role: "Admin"};

        const res = await request(app)
            .get(`/api/users/nouser/transactions/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(nouser, "1h")
                + "; refreshToken=" + generateToken(nouser, "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("user does not exist");
    });

    test('admin route - should return 400 if category does not exist', async () => {
        const res = await request(app)
            .get(`/api/transactions/users/${list_of_users[1].username}/category/nocategory`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("category does not exist");
    });

    test('user route - should return 400 if category does not exist', async () => {
        const res = await request(app)
            .get(`/api/users/${list_of_users[0].username}/transactions/category/nocategory`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toStrictEqual("category does not exist");
    });
})

describe("getTransactionsByGroup", () => {
    const list_of_categories = [{type: "type1", color: "color1"},
        {type: "type2", color: "color2"}, {type: "type3", color: "color3"}, {type: "type4", color: "color4"}];

    const list_of_transactions = [
        {username: "tester", amount: 10, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 20, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester3", amount: 30, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 40, type: "type4", date: "2023-05-14T14:27:59.045Z", color: "color4"},
        {username: "tester3", amount: 60, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 70, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2"}];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"},
        {username: "tester4", email: "test4@test.com", password: "tester4", role: "Regular"}];

    const list_of_groups = [{name: "group1", members:
            [{email: "test@test.com"}, {email: "test3@test.com"}]}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_groups)
        {   await Group.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_transactions)
        {   await transactions.create( c )}
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({});
        await Group.deleteMany({});
    })

    test('admin route - should return empty list if there are no group transactions', async () => {
        await transactions.deleteMany({});

        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);

        for(const c of list_of_transactions)
        {   await transactions.create( c )}
    });

    test('admin route - should retrieve list of all group transactions', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect((res.body.data)[0].amount).toBe(10);
        expect((res.body.data)[1].amount).toBe(20);
        expect((res.body.data)[2].amount).toBe(30);
        expect((res.body.data)[3].amount).toBe(40);
        expect((res.body.data)[4].amount).toBe(60);
        expect((res.body.data)[5].amount).toBe(70);
    });

    test('user route - should return empty list if there are no group transactions', async () => {
        await transactions.deleteMany({});

        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);

        for(const c of list_of_transactions)
        {   await transactions.create( c )}
    });

    test('user route - should retrieve list of all group transactions', async () => {
        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect((res.body.data)[0].amount).toBe(10);
        expect((res.body.data)[1].amount).toBe(20);
        expect((res.body.data)[2].amount).toBe(30);
        expect((res.body.data)[3].amount).toBe(40);
        expect((res.body.data)[4].amount).toBe(60);
        expect((res.body.data)[5].amount).toBe(70);
    });

    test('admin route - Unauthorized access', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    test('user route - Unauthorized access', async () => {
        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[2], "1h")
                + "; refreshToken=" + generateToken(list_of_users[2], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    test('admin route - Group not found', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/nogroup`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Group not found");
    });

    test('user route - Group not found', async () => {
        const res = await request(app)
            .get(`/api/groups/nogroup/transactions`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Group not found");
    });
})

describe("getTransactionsByGroupByCategory", () => {
    const list_of_categories = [{type: "type1", color: "color1"},
        {type: "type2", color: "color2"}, {type: "type3", color: "color3"}, {type: "type4", color: "color4"}];

    const list_of_transactions = [
        {username: "tester", amount: 10, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 20, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester3", amount: 30, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 40, type: "type4", date: "2023-05-14T14:27:59.045Z", color: "color4"},
        {username: "tester3", amount: 60, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
        {username: "tester", amount: 70, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2"}];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    const list_of_groups = [{name: "group1", members:
            [{email: "test@test.com"}, {email: "test3@test.com"}]}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_groups)
        {   await Group.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_transactions)
        {   await transactions.create( c )}
    })
    afterAll(async () => {
        await User.deleteMany({})
        await categories.deleteMany({})
        await transactions.deleteMany({});
        await Group.deleteMany({});
    })

    test('admin route - should return the list of transactions for that group and category', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(4);
        expect((res.body.data)[0].username).toBe("tester");
        expect((res.body.data)[0].amount).toBe(10);
        expect((res.body.data)[0].type).toBe("type1");
        expect((res.body.data)[0].color).toBe("color1");
        expect((res.body.data)[1].username).toBe("tester");
        expect((res.body.data)[1].amount).toBe(20);
        expect((res.body.data)[1].type).toBe("type1");
        expect((res.body.data)[1].color).toBe("color1");
        expect((res.body.data)[2].username).toBe("tester3");
        expect((res.body.data)[2].amount).toBe(30);
        expect((res.body.data)[2].type).toBe("type1");
        expect((res.body.data)[2].color).toBe("color1");
        expect((res.body.data)[3].username).toBe("tester3");
        expect((res.body.data)[3].amount).toBe(60);
        expect((res.body.data)[3].type).toBe("type1");
        expect((res.body.data)[3].color).toBe("color1");
    });

    test('user route - should return the list of transactions for that group and category', async () => {
        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(4);
        expect((res.body.data)[0].username).toBe("tester");
        expect((res.body.data)[0].amount).toBe(10);
        expect((res.body.data)[0].type).toBe("type1");
        expect((res.body.data)[0].color).toBe("color1");
        expect((res.body.data)[1].username).toBe("tester");
        expect((res.body.data)[1].amount).toBe(20);
        expect((res.body.data)[1].type).toBe("type1");
        expect((res.body.data)[1].color).toBe("color1");
        expect((res.body.data)[2].username).toBe("tester3");
        expect((res.body.data)[2].amount).toBe(30);
        expect((res.body.data)[2].type).toBe("type1");
        expect((res.body.data)[2].color).toBe("color1");
        expect((res.body.data)[3].username).toBe("tester3");
        expect((res.body.data)[3].amount).toBe(60);
        expect((res.body.data)[3].type).toBe("type1");
        expect((res.body.data)[3].color).toBe("color1");
    });

    test('admin route - should return empty list if there are no group transactions for that category', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}/category/type3`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);
    });

    test('user route - should return empty list if there are no group transactions for that category', async () => {
        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions/category/type3`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(200);
        expect(res.body.data).toStrictEqual([]);
    });

    test('admin route - Unauthorized access', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    test('user route - Unauthorized access', async () => {
        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions/category/${list_of_categories[0].type}`);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    test('admin route - Group not found', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/nogroup/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Group not found");
    });

    test('user route - Group not found', async () => {
        const res = await request(app)
            .get(`/api/groups/nogroup/transactions/category/${list_of_categories[0].type}`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Group not found");
    });

    test('admin route - Category not found', async () => {
        const res = await request(app)
            .get(`/api/transactions/groups/${list_of_groups[0].name}/category/notype`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[1], "1h")
                + "; refreshToken=" + generateToken(list_of_users[1], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Category not found");
    });

    test('user route - Category not found', async () => {
        const res = await request(app)
            .get(`/api/groups/${list_of_groups[0].name}/transactions/category/notype`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h")
                + "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Category not found");
    });
})

describe("deleteTransaction", () => { 
    let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
    {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
    {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

    beforeAll(async () => {
        for (const c of list_of_users)
        { await User.create( c )}

        await transactions.create({username: "tester", amount: 10, type: "type1", date : new Date("2021-01-01")})
        await transactions.create({username: "tester", amount: 11, type: "type2", date : new Date("2021-01-02")})
        await transactions.create({username: "tester", amount: 12, type: "type3", date : new Date("2021-01-03")})
        await transactions.create({username: "tester", amount: 13, type: "type4", date : new Date("2021-01-04")})
        await transactions.create({username: "tester", amount: 14, type: "type5", date : new Date("2021-01-05")})
        await transactions.create({_id :"6478f67648e93a914f316ca5",username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
        await transactions.create({username: "tester2", amount: 17, type: "type3", date : new Date("2021-01-08")})
        await transactions.create({username: "tester3",amount: 18, type: "type4", date : new Date("2021-01-09")}) 
    })
    afterAll(async () => {
        await User.deleteMany({})
        await transactions.deleteMany({})
    })

    test('Invalid user', async () => {
        let username = "tester2"
        const res = await request(app).delete(`/api/users/${username}/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"))
        .send({_id : 13 });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");    
    })

    test("req body not present", async () => {
        let username = "tester"
        const res = await request(app).delete(`/api/users/${username}/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"))
    
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Missing _id");
    })


    test("transaction not found", async () => {

        let username = "tester"
        const res = await request(app).delete(`/api/users/${username}/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"))
        .send({_id : "6478f67648e93a914f316ca8" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Transaction not deleted");
    })


    test("User try to delete a transaction created by another user ", async () => {
    
        let username = "tester"
        let myId = "6478f67648e93a914f316ca5"
        const res = await request(app).delete(`/api/users/${username}/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"))
        .send({_id : myId });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Transaction not deleted");
    })

    test("User try to delete a transaction created by himself ", async () => {
        
            let username = "tester2"
            let myId = "6478f67648e93a914f316ca5"
            const res = await request(app).delete(`/api/users/${username}/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[1], "1h") + "; refreshToken=" + generateToken(list_of_users[1], "1h"))
            .send({_id : myId });
    
            expect(res.status).toBe(200);
            expect(res.body).toStrictEqual({data : {message: "Transaction deleted"}} );
            let find  = await transactions.findById(myId)
            expect(find).toBe(null)
    })
})

describe("deleteTransactions", () => { 
    let list_of_users = [{username: "tester", email: "test@test.com", password: "tester", role: "Regular"}, 
    {username: "tester2", email: "test2@test.com", password: "tester2", role: "Regular"}, 
    {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}]

    beforeAll(async () => {
        for (const c of list_of_users)
        { await User.create( c )}

        await transactions.create({username: "tester", amount: 10, type: "type1", date : new Date("2021-01-01")})
        await transactions.create({username: "tester", amount: 11, type: "type2", date : new Date("2021-01-02")})
        await transactions.create({username: "tester", amount: 12, type: "type3", date : new Date("2021-01-03")})
        await transactions.create({username: "tester", amount: 13, type: "type4", date : new Date("2021-01-04")})
        await transactions.create({username: "tester", amount: 14, type: "type5", date : new Date("2021-01-05")})
        await transactions.create({_id :"6478f67648e93a914f316ca5", username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({_id :"6478f67648e93a914f316ca6",username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
        await transactions.create({username: "tester2", amount: 17, type: "type3", date : new Date("2021-01-08")})
        await transactions.create({username: "tester3",amount: 18, type: "type4", date : new Date("2021-01-09")}) 
    })
    afterAll(async () => {
        await User.deleteMany({})
        await transactions.deleteMany({})
    })


    test('Not authorized', async () => {
        const res = await request(app).delete(`/api/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") + "; refreshToken=" + generateToken(list_of_users[0], "1h"))
        .send({_ids : [1,2,3]});

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");    
    })
    test("Empty _ids", async () => {
        const res = await request(app).delete(`/api/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"))
        .send({_ids : []});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Missing ids");    
    })

    test("Invalid single id", async () => {
        const res = await request(app).delete(`/api/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"))
        .send({_ids : ["" ]});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid id"); 
    })

    test("Id not found" , async () => {
    const res = await request(app).delete(`/api/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"))
    .send({_ids : ["6578f67648e93a914f316ca5" ]});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid id");
    })


    test("Transaction correctly deleted", async () => {
        let myid = "6478f67648e93a914f316ca5" 
        let myid2 = "6478f67648e93a914f316ca6" 

        const res = await request(app).delete(`/api/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[2], "1h") + "; refreshToken=" + generateToken(list_of_users[2], "1h"))
        .send({_ids : [myid, myid2]});
        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({data : {message :"All transactions deleted"} });
        let ff = await transactions.findOne({_id: myid})
        expect(ff).toBe(null)
        let ff2 = await transactions.findOne({_id: myid2})
        expect(ff2).toBe(null)


        await transactions.create({_id :"6478f67648e93a914f316ca5", username: "tester2", amount: 15, type: "type1", date : new Date("2021-01-06")})
        await transactions.create({_id :"6478f67648e93a914f316ca6",username: "tester2", amount: 16, type: "type2", date : new Date("2021-01-07")})
    
    })

    test("Transaction correctly deleted with Access token expired", async () => {

        let myid = "6478f67648e93a914f316ca5" 
        let myid2 = "6478f67648e93a914f316ca6" 

        const res = await request(app).delete(`/api/transactions`).set( "Cookie", "accessToken=" + generateToken(list_of_users[2], "1ms") + "; refreshToken=" + generateToken(list_of_users[2], "1h"))
        .send({_ids : [myid, myid2]});
        expect(res.status).toBe(200);
        expect(res.body.data.message).toStrictEqual("All transactions deleted");
        expect(res.body.refreshedTokenMessage).not.toBe(undefined)
        let ff = await transactions.findOne({_id: myid})
        expect(ff).toBe(null)
        let ff2 = await transactions.findOne({_id: myid2})
        expect(ff2).toBe(null)


    })
})
