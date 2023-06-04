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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
