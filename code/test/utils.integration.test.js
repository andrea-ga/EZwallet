import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import {Group, User} from "../models/User.js";
import {categories, transactions} from "../models/model.js";
import {app} from "../app";
import request from "supertest";

import dotenv from "dotenv";
import mongoose, { Model } from 'mongoose';
import jwt from "jsonwebtoken";

dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseController";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    User.deleteMany({});
    Group.deleteMany({});
    categories.deleteMany({});
    transactions.deleteMany({});

});

afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});

const generateToken = (payload, expirationTime = '1h') => {
    return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime});
};

describe("handleDateFilterParams", () => {

    const list_of_categories = [{type: "type5", color: "color5"},
        {type: "type6", color: "color6"}, {type: "type7", color: "color7"}, {type: "type8", color: "color8"}];

    const list_of_transactions = [
        {username: "tester5", amount: 10, type: "type5", date: "2023-12-14T14:27:59.045Z", color: "color5"},
        {username: "tester5", amount: 20, type: "type5", date: "2023-05-14T14:27:59.045Z", color: "color5"},
        {username: "tester7", amount: 30, type: "type5", date: "2023-03-14T14:27:59.045Z", color: "color5"},
        {username: "tester5", amount: 40, type: "type8", date: "2023-05-14T14:27:59.045Z", color: "color8"},
        {username: "tester7", amount: 60, type: "type5", date: "2023-05-14T14:27:59.045Z", color: "color5"},
        {username: "tester5", amount: 70, type: "type6", date: "2023-01-14T14:27:59.045Z", color: "color6"}];

    const list_of_users = [
        {username: "tester5", email: "test5@test.com", password: "tester5", role: "Regular"},
        {username: "tester6", email: "test6@test.com", password: "tester6", role: "Admin"},
        {username: "tester7", email: "test7@test.com", password: "tester7", role: "Regular"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_transactions)
        {   await transactions.create( c )}
    })
    afterAll(async () => {
        for (const c of list_of_users)
        {   await User.deleteOne( c )}

        for (const c of list_of_categories)
        {   await categories.deleteOne( c )}

        for (const c of list_of_transactions)
        {   await transactions.deleteOne( c )}
    })

    test('from filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?from=2023-05-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[0],
            list_of_transactions[1], list_of_transactions[3]]);
    });

    test('upTo filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?upTo=2023-05-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[1], list_of_transactions[3],
            list_of_transactions[5]]);
    });

    test('date filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?date=2023-05-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[1], list_of_transactions[3]]);
    });

    test('from and upTo filters', async() => {
        const res =  await request(app).get(`/api/users/${list_of_users[0].username}/transactions?from=2023-01-14&upTo=2023-12-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"))

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[0],
                    list_of_transactions[1], list_of_transactions[3], list_of_transactions[5]]);
    });

    test('date and upTo filters',  async() => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?date=2023-05-14&upTo=2023-12-14`)
                .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                    "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("wrong query format");
    });

    test('date and from filters', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?date=2023-05-14&from=2023-01-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toStrictEqual("wrong query format");
    });

    test('wrong date - from filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?from=2023-abc-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toStrictEqual("wrong date format");
    });

    test('wrong date - upTo filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?upTo=2023-abc-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toStrictEqual("wrong date format");
    });

    test('wrong date - date filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?date=2023-abc-14`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toStrictEqual("wrong date format");
    });
})

describe("verifyAuth", () => {
    test("Token is missing information (username)", async () => {
        let req = {
            cookies: {
                refreshToken: generateToken({ role: "user", id: "4839230", email: "tester@test.com" }, '1h'),
                accessToken: generateToken({ username: "tester", role: "user", id: "4839230", email: "tester@test.com" }, '1h')
            }
        }
        let info = {
            authType: "User",
            username: "tester"
        }
        let res = {}
        let result = verifyAuth(req, res, info)
        expect(result).toStrictEqual({ flag: false, cause: "Token is missing information" })
    })
    test("Token is missing information (role)", async () => {
        let req = {
            cookies: {
                refreshToken: generateToken({ username: "tester", id: "4839230", email: "tester@test.com" }, '1h'),
                accessToken: generateToken({ username: "tester", id: "4839230", email: "tester@test.com" }, '1h')
            }
        }
        let info = {
            authType: "User",
            username: "tester"
        }
        let res = {}
        let result = verifyAuth(req, res, info)
        expect(result).toStrictEqual({ flag: false, cause: "Token is missing information" })
    })
    test("Token is missing information (email)", async () => {
        let req = {
            cookies: {
                refreshToken: generateToken({ username: "tester", id: "4839230", role: "user" }, '1h'),
                accessToken: generateToken({ username: "tester", id: "4839230", role: "user" }, '1h')
            }
        }
        let info = {
            authType: "User",
            username: "tester"
        }
        let res = {}
        let result = verifyAuth(req, res, info)
        expect(result).toStrictEqual({ flag: false, cause: "Token is missing information" })
    })

    test("Token with different username", async () => {
        let req = {
            cookies: {
                refreshToken: generateToken({ username: "tester2", id: "4839230", role: "user", email: "tester@test.com" }, '1h'),
                accessToken: generateToken({ username: "tester", id: "4839230", role: "user", email: "tester@test.com" }, '1h')
            }
        }
        let info = {
            authType: "User",
            username: "tester"
        }
        let res = {}
        let result = verifyAuth(req, res, info)
        expect(result).toStrictEqual({ flag: false, cause: "Mismatched users" })
    })
    test("Token with different email", async () => {
        let req = {
            cookies: {
                refreshToken: generateToken({ username: "tester", id: "4839230", role: "user", email: "tester@test.com" }, '1h'),
                accessToken: generateToken({ username: "tester", id: "4839230", role: "user", email: "tester2@test.com" }, '1h')
            }
        }
        let info = {
            authType: "User",
            username: "tester"
        }
        let res = {}
        let result = verifyAuth(req, res, info)
        expect(result).toStrictEqual({ flag: false, cause: "Mismatched users" })
    })
    test("Access and refresh token expired", async () => {
        let req = {
            cookies: {
                refreshToken: generateToken({ username: "tester", role: "user", id: "4839230", email: "tester@test.com" }, '1ms'),
                accessToken: generateToken({ username: "tester", role: "user", id: "4839230", email: "tester@test.com" }, '1ms')
            }
        }
        let info = {
            authType: "User",
            username: "tester"
        }
        let res = {
            Cookie: { accessToken: undefined },
            locals: { refreshTokenMessage: undefined }
        }
        let result = verifyAuth(req, res, info)
        expect(result.flag).toBe(false)
        expect(result.cause).toBe("Perform login again")
    })
})

describe("handleAmountFilterParams", () => {

    const list_of_categories = [
        {type: "type5", color: "color5"}, {type: "type6", color: "color6"},
        {type: "type7", color: "color7"}, {type: "type8", color: "color8"}];

    const list_of_transactions = [
        {username: "tester5", amount: 10, type: "type5", date: "2023-12-14T14:27:59.045Z", color: "color5"},
        {username: "tester5", amount: 20, type: "type5", date: "2023-05-14T14:27:59.045Z", color: "color5"},
        {username: "tester7", amount: 30, type: "type5", date: "2023-03-14T14:27:59.045Z", color: "color5"},
        {username: "tester5", amount: 40, type: "type8", date: "2023-05-14T14:27:59.045Z", color: "color8"},
        {username: "tester7", amount: 60, type: "type5", date: "2023-05-14T14:27:59.045Z", color: "color5"},
        {username: "tester5", amount: 70, type: "type6", date: "2023-01-14T14:27:59.045Z", color: "color6"}];

    const list_of_users = [
        {username: "tester5", email: "test5@test.com", password: "tester5", role: "Regular"},
        {username: "tester6", email: "test6@test.com", password: "tester6", role: "Admin"},
        {username: "tester7", email: "test7@test.com", password: "tester7", role: "Regular"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}

        for (const c of list_of_categories)
        {   await categories.create( c )}

        for (const c of list_of_transactions)
        {   await transactions.create( c )}
    })
    afterAll(async () => {
        for (const c of list_of_users)
        {   await User.deleteOne( c )}

        for (const c of list_of_categories)
        {   await categories.deleteOne( c )}

        for (const c of list_of_transactions)
        {   await transactions.deleteOne( c )}
    })

    test('min filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?min=30`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[3], list_of_transactions[5]]);
    });

    test('max filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?max=30`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[0], list_of_transactions[1]]);
    });

    test('max and min filter', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?max=50&min=30`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toStrictEqual([list_of_transactions[3]]);
    });

    test('min is not a number', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?min=abc`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toStrictEqual("the min amount value is not a number");
    });

    test('max is not a number', async () => {
        const res = await request(app).get(`/api/users/${list_of_users[0].username}/transactions?max=abc`)
            .set("Cookie", "accessToken=" + generateToken(list_of_users[0], "1h") +
                "; refreshToken=" + generateToken(list_of_users[0], "1h"));

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toStrictEqual("the max amount value is not a number");
    });
})
