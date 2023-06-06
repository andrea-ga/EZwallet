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

    const list_of_users = [
        {username: "tester5", email: "test5@test.com", password: "tester5", role: "Regular"},
        {username: "tester6", email: "test6@test.com", password: "tester6", role: "Admin"},
        {username: "tester7", email: "test7@test.com", password: "tester7", role: "Regular"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}
    })
    afterAll(async () => {
        for (const c of list_of_users)
        {   await User.deleteOne( c )}
    })

    test('from filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?from=2023-05-14` ,
            query: {from: "2023-05-14"}};

        const res = handleDateFilterParams(req);

        expect(res).toStrictEqual({date: {$gte: new Date("2023-05-14T00:00:00.000Z")}});
    });

    test('upTo filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?upTo=2023-05-14` ,
            query: {upTo: "2023-05-14"}};

        const res = handleDateFilterParams(req);

        expect(res).toStrictEqual({date: {$lte: new Date("2023-05-14T23:59:59.000Z")}});
    });

    test('date filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?date=2023-05-14` ,
            query: {date: "2023-05-14"}};

        const res = handleDateFilterParams(req);

        expect(res).toStrictEqual({date: {$lte: new Date("2023-05-14T23:59:59.000Z"), $gte: new Date("2023-05-14T00:00:00.000Z")}});
    });

    test('from and upTo filters', async() => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?from=2023-01-14&upTo=2023-12-14` ,
            query: {from: "2023-01-14", upTo: "2023-12-14"}};

        const res = handleDateFilterParams(req);

        expect(res).toStrictEqual({date: {$lte: new Date("2023-12-14T23:59:59.000Z"), $gte: new Date("2023-01-14T00:00:00.000Z")}});
    });

    test('date and upTo filters',  async() => {
        const req = {
            url: `/api/users/${list_of_users[0].username}/transactions?date=2023-05-14&upTo=2023-12-14`,
            query: {date: "2023-01-14", upTo: "2023-12-14"}
        };

        try {
            handleDateFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("wrong query format");
        }
    });

    test('date and from filters', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?date=2023-05-14&from=2023-01-14` ,
            query: {date: "2023-01-14", from: "2023-12-14"}};

        try {
            handleDateFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("wrong query format");
        }
    });

    test('wrong date - from filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?from=2023-abc-14` ,
            query: {from: "2023-abc-14"}};

        try {
            handleDateFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("wrong date format");
        }
    });

    test('wrong date - upTo filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?upTo=2023-abc-14` ,
            query: {upTo: "2023-abc-14"}};

        try {
            handleDateFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("wrong date format");
        }
    });

    test('wrong date - date filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?date=2023-abc-14` ,
            query: {date: "2023-abc-14"}};

        try {
            handleDateFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("wrong date format");
        }
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

    const list_of_users = [
        {username: "tester5", email: "test5@test.com", password: "tester5", role: "Regular"},
        {username: "tester6", email: "test6@test.com", password: "tester6", role: "Admin"},
        {username: "tester7", email: "test7@test.com", password: "tester7", role: "Regular"}];

    beforeAll(async () => {
        for (const c of list_of_users)
        {   await User.create( c )}
    })
    afterAll(async () => {
        for (const c of list_of_users)
        {   await User.deleteOne( c )}
    })

    test('min filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?min=30` ,
            query: {min: "30"}};

        const res = handleAmountFilterParams(req);

        expect(res).toStrictEqual({amount: {$gte: 30}});
    });

    test('max filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?max=30` ,
            query: {max: "30"}};

        const res = handleAmountFilterParams(req);

        expect(res).toStrictEqual({amount: {$lte: 30}});
    });

    test('max and min filter', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?max=50&min=30` ,
            query: {max: "50", min: "30"}};

        const res = handleAmountFilterParams(req);

        expect(res).toStrictEqual({amount: {$gte: 30, $lte: 50}});
    });

    test('min is not a number', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?min=abc` ,
            query: {min: "abc"}};

        try {
            handleAmountFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("the min amount value is not a number");
        }
    });

    test('max is not a number', async () => {
        const req = {url: `/api/users/${list_of_users[0].username}/transactions?max=abc` ,
            query: {max: "abc"}};

        try {
            handleAmountFilterParams(req);
        } catch (e) {
            expect(e.message).toBe("the max amount value is not a number");
        }
    });
})
