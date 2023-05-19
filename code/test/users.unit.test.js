import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { getUsers, getUser, createGroup,getGroup, getGroups } from '../controllers/users';
import { verifyAuth } from '../controllers/utils';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")
jest.mock("../controllers/utils.js")
/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */


describe("getUsers", () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should return empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      //cookie : "refreshToken=refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImExQGcuY29tIiwiaWQiOiI2NDVmOWViOTY0YTQxNzkwNTBkOThhODQiLCJ1c2VybmFtZSI6ImFkMDEiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODQxNzk0NTQsImV4cCI6MTY4NDc4NDI1NH0.dR_mPuUGLWUUq3EXpCG7HpRh0wQAD88sDUZaHp8IEpA"
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    jest.spyOn(User, "find").mockResolvedValue([])
    //User.find.mockResolvedValue([])
    verifyAuth.mockReturnValue({authorized : true})
    await getUsers(mockReq, mockRes)
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data : [], message: mockRes.locals.refreshedTokenMessage})
  })

  test("should retrieve list of all users", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', role : 'Admin' }, { username: 'test2', email: 'test2@example.com', role : 'Admin' }]
    verifyAuth.mockReturnValue({authorized : true})
    //jest.spyOn(User, "find").mockResolvedValue(retrievedUsers)
    User.find.mockResolvedValue(retrievedUsers)
    await getUsers(mockReq, mockRes)
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedUsers, message: mockRes.locals.refreshedTokenMessage})
  })

  test("Unauthorized access", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
      
    verifyAuth.mockReturnValue({authorized : false, cause : "Unauthorized"})
    await getUsers(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(User.find).not.toHaveBeenCalled()
    expect(mockRes.json).toHaveBeenCalledWith({error : "Unauthorized" })

  })

  test("raise exception", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
      const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', role : 'Admin' }, { username: 'test2', email: 'test2@example.com', role : 'Admin' }]
      verifyAuth.mockReturnValueOnce({authorized : true }) //admin auth
    User.findOne.mockImplementation(() => {
      throw new Error("Internal error");
    })
    
    await getUsers(mockReq, mockRes)
    expect(User.find).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })
})

describe("getUser", () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("admin login", async () => {
    const mockReq = {
      params :{ username : "test1" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = { username: mockReq.params.username, email: 'test1@example.com', role : 'Regular' }
    verifyAuth.mockReturnValueOnce({authorized : false}).mockReturnValueOnce({authorized : true}) //admin auth
    //the first one is for the user/ the second one for the admin
    User.findOne.mockResolvedValue(retrievedUser)
    
    await getUser(mockReq, mockRes)
    //expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedUser, message: mockRes.locals.refreshedTokenMessage})
  })

  
  test("no credential ", async () => {
    const mockReq = {
      params :{ username : "test1" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = { username: mockReq.params.username, email: 'test1@example.com', role : 'Regular' }
    verifyAuth.mockReturnValueOnce({authorized : false }).mockReturnValueOnce({authorized : false , cause : "Unauthorized"}) //admin auth
    User.findOne.mockResolvedValue(retrievedUser)
    
    await getUser(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"})
  })

  test("user not found", async () => {
    const mockReq = {
      params :{ username : "test1" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = undefined
    verifyAuth.mockReturnValueOnce({authorized : false }).mockReturnValueOnce({authorized : true , cause : "Unauthorized"}) //admin auth
    User.findOne.mockResolvedValue(retrievedUser)
    
    await getUser(mockReq, mockRes)
    expect(User.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error: "User not found"})
  })
  

  test("user search his profile", async () => {
    const mockReq = {
      params :{ username : "test1" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = { username: mockReq.params.username, email: 'test1@example.com', role : 'Regular' }
    verifyAuth.mockReturnValueOnce({authorized : true }) //admin auth
    User.findOne.mockResolvedValue(retrievedUser)
    
    await getUser(mockReq, mockRes)
    expect(User.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedUser, message: mockRes.locals.refreshedTokenMessage})
  })

  test("raise exception", async () => {
    const mockReq = {
      params :{ username : "test1" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = { username: mockReq.params.username, email: 'test1@example.com', role : 'Regular' }
    verifyAuth.mockReturnValueOnce({authorized : true }) //admin auth
    User.findOne.mockImplementation(() => {
      throw new Error("Internal error");
    })
    
    await getUser(mockReq, mockRes)
    expect(User.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })

})

describe("createGroup", () => { 

  beforeEach(() => {
    jest.resetAllMocks();
  });
/*test("group creation correctly", async () => {
    const mockReq = {
       name : "g1" ,
       memberEmails : ["mail1.com", "mail2.com"]
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = { username: mockReq.params.username, email: 'test1@example.com', role : 'Regular' }
    verifyAuth.mockReturnValueOnce({authorized : false}).mockReturnValueOnce({authorized : true}) //admin auth
    //the first one is for the user/ the second one for the admin
    User.findOne.mockResolvedValue(retrievedUser)
    
    await getUser(mockReq, mockRes)
    //expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedUser, message: mockRes.locals.refreshedTokenMessage})
  })*/




})

describe("getGroups", () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });

  /*test("admin request", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedUser = { username: mockReq.params.username, email: 'test1@example.com', role : 'Regular' }
    verifyAuth.mockReturnValueOnce({authorized : false}).mockReturnValueOnce({authorized : true}) //admin auth
    //the first one is for the user/ the second one for the admin
    User.findOne.mockResolvedValue(retrievedUser)
    
    await getGroups(mockReq, mockRes)
    //expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedUser, message: mockRes.locals.refreshedTokenMessage})
  })*/




})

describe("getGroup", () => { })

describe("addToGroup", () => { })

describe("removeFromGroup", () => { })

describe("deleteUser", () => { })

describe("deleteGroup", () => { })