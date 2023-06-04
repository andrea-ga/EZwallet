import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import { access } from 'fs';
import exp from 'constants';


dotenv.config();
const generateToken = (payload, expirationTime = '1h') => {
    return jwt.sign(payload, "EZWALLET", { expiresIn: expirationTime });
};

describe("handleDateFilterParams", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
