import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions } from '../models/model';
import { getUsers, getUser, createGroup,getGroup, getGroups,deleteUser, addToGroup } from '../controllers/users';
import { verifyAuth } from '../controllers/utils';
import { group } from 'console';
import { url } from 'inspector';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")
jest.mock("../models/model.js")
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
    expect(mockRes.json).toHaveBeenCalledWith({data : [], refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
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
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedUsers, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
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
    User.find.mockImplementation(() => {
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

  test("Wrong path", async () => {
    const mockReq = {
      params :{ username : "" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    //the first one is for the user/ the second one for the admin
    
    await getUser(mockReq, mockRes)
    //expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalled()
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
    expect(mockRes.status).toHaveBeenCalledWith(400)
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
 /* test("Normal behavior", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciao@gmail.com", "hello@hotmail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
    Group.findOne.mockResolvedValueOnce(false) //if group already present
    User.findOne.mockResolvedValueOnce({username : "hello" , email : "hello@hotmail.com"}) //the user is not already in a group
    //all the mail are correct so pass the validation test
    Group.findOne.mockResolvedValue(false) //if the creator is already in a group
    User.find.mockResolvedValue({username : "ciao", email : "hello"}) //check if all the users exist
    
    Group.findOne.mockResolvedValue(false)//no mail already in other groups
    Group.insertMany.mockResolvedValue(true)
    await createGroup(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data : {
      group : {name : "g1" ,
       members : ["ciao@gmail.com", "hello@hotmail.com"]},
       membersNotFound : [], 
       alreadyInGroup : []
    },
    refreshedTokenMessage  : mockReq.locals.refreshedTokenMessage
  })
  })


  test("Email creator not present in the list", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciao@gmail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
    Group.findOne.mockResolvedValueOnce(false) //if group already present
    User.findOne.mockResolvedValueOnce({username : "hello" , email : "hello@hotmail.com"}) //the user is not already in a group
    //all the mail are correct so pass the validation test
    Group.findOne.mockResolvedValue(false) //if the creator is already in a group
    User.find.mockResolvedValue({username : "ciao", email : "hello"}) //check if all the users exist
    
    Group.findOne.mockResolvedValue(false)//no mail already in other groups
    Group.insertMany.mockResolvedValue(true)
    await createGroup(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data : {
      group : {name : "g1" ,
       members : ["ciao@gmail.com", "hello@hotmail.com"]},
       membersNotFound : [], 
       alreadyInGroup : []
    },
    refreshedTokenMessage  : mockReq.locals.refreshedTokenMessage
  })
  })*/

  test("Group with the same name already exist", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciao@gmail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
    Group.findOne.mockResolvedValueOnce(true) 
    
    await createGroup(mockReq, mockRes)

  
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalled()
  })


  test("No cookies", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciao@gmail.com", "hello@gmail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : false , cause : "Unauthorized"})  
    await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalled()
  
  })
  test("Email format not valid", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
    Group.findOne.mockResolvedValueOnce(false) //if group already present
    User.findOne.mockResolvedValueOnce({username : "hello" , email : "hello@hotmail.com"}) //the user is not already in a group
    //all the mail are correct so pass the validation test
    Group.findOne.mockResolvedValue(false) //if the creator is already in a group
    await createGroup(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalled()
  })
  test("invalid request", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
   await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalled()
  })

  test("Group creator already in a group", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciao@gmail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
    Group.findOne.mockResolvedValueOnce(false) //if group already present
    User.findOne.mockResolvedValueOnce({username : "hello" , email : "hello@hotmail.com"}) //the user is not already in a group
    //all the mail are correct so pass the validation test
    Group.findOne.mockResolvedValueOnce(true) //if the creator is already in a group
    
    await createGroup(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ error: "User creator already present in a group" })
  })

  test("All email are not found or already in a group", async () => {
    const mockReq = {
      cookies :  "ccc",
      body : {
      name : "g1" ,
       memberEmails : ["ciao@gmail.com", "hi@gmail.com"]
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    verifyAuth.mockReturnValue({authorized : true})  
    Group.findOne.mockResolvedValueOnce(false) //if group already present
    User.findOne.mockResolvedValueOnce({username : "hello" , email : "hello@hotmail.com"}) //the user is not already in a group
    //all the mail are correct so pass the validation test
    Group.findOne.mockResolvedValueOnce(false) //if the creator is already in a group
    User.findOne.mockResolvedValueOnce(false).mockResolvedValueOnce({username : "hello" , email : "hello@hotmail.com"})  //the user is not already in a group
    Group.findOne.mockResolvedValueOnce(false)
    await createGroup(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ error: "the `memberEmails` either do not exist or are already in a group" })
  })

})

describe("getGroups", () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("admin request", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedGroup = [{ name : "g1 ", members : ["t1@t1.com", "t2@t2.com"] }]
    verifyAuth.mockReturnValue({authorized : true})
    //the first one is for the user/ the second one for the admin
    Group.find.mockResolvedValue(retrievedGroup)
    
    await getGroups(mockReq, mockRes)
    expect(Group.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedGroup, message: mockRes.locals.refreshedTokenMessage})
  })

  test("no admin", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    verifyAuth.mockReturnValue({authorized : false , cause : "Unauthorized"})
    //the first one is for the user/ the second one for the admin
    
    await getGroups(mockReq, mockRes)
    expect(Group.find).not.toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error : "Unauthorized"})
  })

  test("No groups", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    verifyAuth.mockReturnValue({authorized : true})
    //the first one is for the user/ the second one for the admin
    Group.find.mockResolvedValue([])
    
    await getGroups(mockReq, mockRes)
    expect(Group.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :[], message: mockRes.locals.refreshedTokenMessage})
  })

  test("admin request", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedGroup = [{ name : "g1 ", members : ["t1@t1.com", "t2@t2.com"] }]
    verifyAuth.mockReturnValue({authorized : true})
    //the first one is for the user/ the second one for the admin
    Group.find.mockResolvedValue(retrievedGroup)
    
    await getGroups(mockReq, mockRes)
    expect(Group.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedGroup, message: mockRes.locals.refreshedTokenMessage})
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
    verifyAuth.mockReturnValueOnce({authorized : true }) //admin auth
    Group.find.mockImplementation(() => {
      throw new Error("Internal error");
    })
    
    await getGroups(mockReq, mockRes)
    expect(Group.find).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })

})

describe("getGroup", () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });
  test("admin request", async () => {
    const mockReq = { 
      params :{  name : "g1"} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedGroup = { name : "g1 ", members : ["t1@t1.com", "t2@t2.com"] }
    verifyAuth.mockReturnValueOnce({authorized : true}).mockReturnValueOnce({authorized : true})
    Group.findOne.mockResolvedValue(retrievedGroup)
    
    await getGroup(mockReq, mockRes)
    expect(Group.findOne).toHaveBeenCalledWith({name : mockReq.params.name})
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedGroup, message: mockRes.locals.refreshedTokenMessage})
  })
  
  test("no cookies", async () => {
    const mockReq = { 
      params :{  name : "g1"} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedGroup = {}
    verifyAuth.mockReturnValueOnce({authorized : false , cause : "Unauthorized"})
    Group.findOne.mockResolvedValue(retrievedGroup)
    
    await getGroup(mockReq, mockRes)
    expect(Group.findOne).toHaveBeenCalledWith({name : mockReq.params.name})
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error : "Unauthorized"})
  })
  
  test("user in the group list", async () => {
    const mockReq = { 
      params :{  name : "g1"} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedGroup = [{ name : "g1 ", members : ["t1@t1.com", "t2@t2.com"] }]
    verifyAuth.mockReturnValueOnce({authorized : true}).mockReturnValueOnce({authorized : false}).mockReturnValueOnce({authorized : true})
    Group.findOne.mockResolvedValue(retrievedGroup)
    
    await getGroup(mockReq, mockRes)
    expect(Group.findOne).toHaveBeenCalledWith({name : mockReq.params.name})
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data :retrievedGroup, message: mockRes.locals.refreshedTokenMessage})
  })
  test("user not in the group list", async () => {
    const mockReq = { 
      params :{  name : "g1"} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const retrievedGroup = [{ name : "g1 ", members : ["t1@t1.com", "t2@t2.com"] }]
    verifyAuth.mockReturnValueOnce({authorized : true}).mockReturnValueOnce({authorized : false}).mockReturnValueOnce({authorized : false , cause : "Unauthorized"})
    Group.findOne.mockResolvedValue(retrievedGroup)
    
    await getGroup(mockReq, mockRes)
    expect(Group.findOne).toHaveBeenCalledWith({name : mockReq.params.name})
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error : "Unauthorized"})
  })
  test("admin doesn't find a group", async () => {
    const mockReq = { 
      params :{  name : "g1"} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    const rievedGroup = [{ name : "g1 ", members : ["t1@t1.com", "t2@t2.com"] }]
    verifyAuth.mockReturnValueOnce({authorized : true}).mockReturnValueOnce({authorized : true})
    Group.findOne.mockResolvedValue(undefined)
    
    await getGroup(mockReq, mockRes)
    expect(Group.findOne).toHaveBeenCalledWith({name : mockReq.params.name})
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error : "Group not found"})
  })
  test("user not find a group", async () => {
    const mockReq = { 
      params :{  name : "g1"} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    verifyAuth.mockReturnValueOnce({authorized : true}).mockReturnValueOnce({authorized : false})

    Group.findOne.mockResolvedValue(undefined)
    
    await getGroup(mockReq, mockRes)
    expect(Group.findOne).toHaveBeenCalledWith({name : mockReq.params.name})
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error : "Group not found"})
  })
  test("raise exception ", async () => {
    const mockReq = {
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
    verifyAuth.mockReturnValueOnce({authorized : false})
    Group.findOne.mockImplementation(() => {
      throw new Error("Internal error");
    })
    
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })
  test("invalid params ", async () => {
    const mockReq = {
      params :{  name : ""} 
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               }
      }
     
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalled()
  })

    
})

describe("addToGroup", () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });



  /*test("admin successfully add new user to a group 2 users not already present anywhere", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      body : {
      name : "g1" ,
      members : ["us@01.com", "us@02.com"]
      },
      url : "http://localhost:3000/api/groups/g1/insert",
      params : { name : "g1" }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    
    verifyAuth.mockReturnValueOnce({authorized : true }) //pass the first if
    Group.findOne.mockResolvedValue({name : "g1", members : ["us@03.com"]})
    User.findOne.mockResolvedValueOnce("us@01.com").mockResolvedValueOnce("us@02.com")
    Group.findOne.mockResolvedValue(false)
    Group.findOneAndUpdate.mockResolvedValueOnce({name : "g1", members : ["us@03.com","us@01.com", "us@02.com"]})
    await addToGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data  :{
                        group : {
                        name : "g1", 
                        members : ["us@03.com","us@01.com", "us@02.com"] , },
                        alreadyInGroup : [] , 
                      membersNotFound : []} , message : mockRes.locals.refreshedTokenMessage })
  })*/
})

describe("removeFromGroup", () => { })

describe("deleteUser", () => {
beforeEach(() => {
    jest.resetAllMocks();
  });
  test("no admin privileges", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      body : {
      email : "us@01.com"
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    //jest.spyOn(User, "find").mockResolvedValue([])
    verifyAuth.mockReturnValue({authorized : false , cause : "Unauthorized"})  
    await deleteUser(mockReq, mockRes)

    expect(User.findOne).not.toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error : "Unauthorized"})
  })
test("user not found", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      body : {
      email : "us@01.com"
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    //jest.spyOn(User, "find").mockResolvedValue([])
    verifyAuth.mockReturnValue({authorized : true}) 
    User.findOne.mockResolvedValue( undefined ); 

    await deleteUser(mockReq, mockRes);
    
    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error : "User not found"})
  })

test("User successfully deleted and in a group", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      body : {
      email : "us@01.com"
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    //jest.spyOn(User, "find").mockResolvedValue([])
    verifyAuth.mockReturnValue({authorized : true}) 
    User.findOne.mockResolvedValue( { username: "test" ,
      email: "us@01.com",
      password: "rqgniqrgjnnqremcoeq3901084fvncr893dn9c",
      role: "Regular",
      refreshToken : "9924hfoewrhfuhorfoi34uf394uo4ifhrrhlf843fho"} );  

    transactions.remove.mockResolvedValue( {deletedCount  : 3} ); 
    Group.find.mockResolvedValue([ { "_id" : "idicjvri324d" , members : [{email : "us@01.com"}] } , { "_id" : "idicjvridìde24d" , members : [{email : "us@01.com"}]}  ]);
    Group.updateMany.mockResolvedValue(true); 
    User.deleteOne.mockReturnValue(true); 
    Group.findOneAndDelete(true); 

    await deleteUser(mockReq, mockRes)
    
    expect(User.findOne).toHaveBeenCalled()
    expect(transactions.remove).toHaveBeenCalled()
    expect( Group.find).toHaveBeenCalled()
    expect(Group.updateMany).toHaveBeenCalled()
    expect(User.deleteOne).toHaveBeenCalled()
    expect(Group.findOneAndDelete).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data : { deletedTransactions : 3 , removedFromGroup : true } , message : mockRes.locals.refreshedTokenMessage})
  })

test("User successfully deleted, no in a group", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      body : {
      email : "us@01.com"
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    //jest.spyOn(User, "find").mockResolvedValue([])
    verifyAuth.mockReturnValue({authorized : true}) 
    User.findOne.mockResolvedValue( { username: "test" ,
      email: "us@01.com",
      password: "rqgniqrgjnnqremcoeq3901084fvncr893dn9c",
      role: "Regular",
      refreshToken : "9924hfoewrhfuhorfoi34uf394uo4ifhrrhlf843fho"} );  

    transactions.remove.mockResolvedValue( {deletedCount  : 3} ); 
    Group.find.mockResolvedValue([]);
    Group.updateMany.mockResolvedValue(true); 
    User.deleteOne.mockReturnValue(true); 
    Group.findOneAndDelete(true); 

    await deleteUser(mockReq, mockRes)
    
    expect(User.findOne).toHaveBeenCalled()
    expect(transactions.remove).toHaveBeenCalled()
    expect( Group.find).toHaveBeenCalled()
    expect(Group.updateMany).toHaveBeenCalled()
    expect(User.deleteOne).toHaveBeenCalled()
    expect(Group.findOneAndDelete).toHaveBeenCalled()
    
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data : { deletedTransactions : 3 , removedFromGroup : false } , message : mockRes.locals.refreshedTokenMessage})
  })
  test("user not found", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {
      body : {
      email : "us@01.com"
      }
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
      }
    }
    //jest.spyOn(User, "find").mockResolvedValue([])
    verifyAuth.mockReturnValue({authorized : true}) 
    User.findOne.mockImplementation(() => {   
      throw Error("Error")
    } ); 

    await deleteUser(mockReq, mockRes);
    
    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })
  
 })

describe("deleteGroup", () => { })