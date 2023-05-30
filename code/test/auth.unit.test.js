import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import {login , logout } from '../controllers/auth.js'
import { verifyAuth } from '../controllers/utils';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")

jest.mock("bcryptjs")
jest.mock('../models/User.js');
jest.mock("../controllers/utils.js")

describe('register', () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});

describe("registerAdmin", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe('login', () => { 
    beforeEach(() => {
        jest.resetAllMocks();
      });
    test("correct login", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com", password: "securePass"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"", save : jest.fn().mockImplementationOnce(()=> true) } 
        let accessToken = "revjiwnnif"
        let refreshToken = "ssdvwerwr4res"
        User.findOne.mockResolvedValueOnce(user)
        bcrypt.compare.mockResolvedValueOnce(true);
        jest.spyOn(jwt, 'sign').mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken)

        await login(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith({ data: { accessToken: accessToken, refreshToken: refreshToken } }
            )
      })

      test("wrong params (no pwd)", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }

        await login(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({ error : "Not valid request" }
            )
      })

      test("email  wrong format", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com", password: "securePass"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"", save : jest.fn().mockImplementationOnce(()=> true) } 
        User.findOne.mockResolvedValueOnce(user)
        bcrypt.compare.mockResolvedValueOnce(false);

        await login(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({error :'wrong credentials'}
            )
      })
      test("user not found", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com", password: "securePass"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"", save : jest.fn().mockImplementationOnce(()=> true) } 
        User.findOne.mockResolvedValueOnce(false)

        await login(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({error : 'please you need to register'}
            )
      })
});

describe('logout', () => { 
    beforeEach(() => {
        jest.resetAllMocks();
      });

      test("correct logout", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com", password: "securePass"},
          refreshToken : "fihj38hd3r8hh"
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"", save : jest.fn().mockImplementationOnce(()=> true) } 
        User.findOne.mockResolvedValueOnce(user)
        verifyAuth.mockReturnValueOnce({flag : true})
        
        await logout(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith({ data: {message :'logged out'} }
            )
      })
      test("user not found", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com", password: "securePass"},
          refreshToken : "fihj38hd3r8hh"
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"", save : jest.fn().mockImplementationOnce(()=> true) } 
        User.findOne.mockResolvedValueOnce(false)
        verifyAuth.mockReturnValueOnce({flag : true})
        
        await logout(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({ error :'user not found'} 
            )
      })
      test("user not found", async () => {
        const mockReq = {
          body : {email: "mario.red@email.com", password: "securePass"},
          refreshToken : "fihj38hd3r8hh"
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
                   },
            cookie : jest.fn()
          }
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"", save : jest.fn().mockImplementationOnce(()=> true) } 
        User.findOne.mockResolvedValueOnce(user)
        verifyAuth.mockReturnValueOnce({flag : false})
        
        await logout(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({ error :'Unauthorized'} 
            )
      })

});
