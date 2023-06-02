import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import {verifyAuth} from "../controllers/utils.js";
import {createCategory, createTransaction, getAllTransactions, getCategories} from "../controllers/controller.js";
import {User} from "../models/User.js";

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
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

const generateToken = (payload, expirationTime = '1h') => {
    return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime});
};


describe("createCategory", () => {
    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
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
        const res = await request(app).post(`/api/users/nouser/transactions`)
            .send({username: "tester", amount: 10, type: "type1"})
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

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
        {username: "tester", amount: 20, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2"},
        {username: "tester", amount: 30, type: "type3", date: "2023-05-14T14:27:59.045Z", color: "color3"},
        {username: "tester", amount: 40, type: "type4", date: "2023-05-14T14:27:59.045Z", color: "color4"}];

    const list_of_users = [
        {username: "tester", email: "test@test.com", password: "tester", role: "Regular"},
        {username: "tester3", email: "test3@test.com", password: "tester3", role: "Admin"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_categories)
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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUserByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroup", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransaction", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
