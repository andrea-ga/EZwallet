import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import {login , logout, register, registerAdmin } from '../controllers/auth.js'
import { verifyAuth } from '../controllers/utils';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")

jest.mock("bcryptjs")
jest.mock('../models/User.js');
jest.mock("../controllers/utils.js")

describe('register', () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });
test("correct registration", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    jest.spyOn(bcrypt, 'hash').mockReturnValueOnce("ringoneriwnrvtamva")
    User.create.mockResolvedValueOnce(user)

    await register(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: {message: "User added successfully"}}
        )
  })
  test("username already used", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(user)

    await register(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: "The username is already used"}
        )
  })
  test("email already used", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    User.findOne.mockResolvedValueOnce(user)

    await register(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: "The mail is already used"}
        )
  })
  test("email in wrong format", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.rcom", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }

    await register(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: "Not valid request"}
        )
  })
  test("Raise exception", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    User.findOne.mockImplementationOnce(() => {throw new Error("error")})

    await register(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })
});

describe("registerAdmin", () => { 
  beforeEach(() => {
    jest.resetAllMocks();
  });
test("correct registration", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    jest.spyOn(bcrypt, 'hash').mockReturnValueOnce("ringoneriwnrvtamva")
    User.create.mockResolvedValueOnce(user)

    await registerAdmin(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: {message: "User added successfully"}}
        )
  })
  test("username already used", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(user)

    await registerAdmin(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: "The username is already used"}
        )
  })
  test("email already used", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    User.findOne.mockResolvedValueOnce(user)

    await registerAdmin(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: "The mail is already used"}
        )
  })
  test("email in wrong format", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.rcom", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }

    await registerAdmin(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: "Not valid request"}
        )
  })
  test("Raise exception", async () => {
    const mockReq = {
      body : {username: "Mario", email: "mario.red@email.com", password: "securePass"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined
               },
      }
    let user = {id : "64423" , username : "Mario" ,email: "mario.red@email.com", password: "ringoneriwnrvtamva", role : "Regular", refreshToken : "", accessToken :""} 
    let accessToken = "revjiwnnif"
    let refreshToken = "ssdvwerwr4res"
    User.findOne.mockImplementationOnce(() => {throw new Error("error")})

    await registerAdmin(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalled()
  })
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
        expect(mockRes.json).toHaveBeenCalledWith({error : 'User not registered yet'}
            )
      })

      test("raise exception", async () => {
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
        User.findOne.mockImplementationOnce(() => {throw new Error("error")})

        await login(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalled()
      })
});

describe('logout', () => { 
    beforeEach(() => {
        jest.resetAllMocks();
      });
      test("raise exception", async () => {
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
        let user = {id : "64423" , username : "marioR" ,email: "mario.red@email.com", password: "securePass", role : "Admin", refreshToken : "", accessToken :"" } 
        verifyAuth.mockReturnValueOnce({flag : true})
        User.findOne.mockImplementation(() => {
      throw new Error("Internal error");
    })
        await logout(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalled( )
      })
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
        verifyAuth.mockReturnValueOnce({flag : true})
        User.findOne.mockResolvedValueOnce(false)
        
        
        await logout(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({ error :'user not found'} 
            )
      })
      test("Unauthorized", async () => {
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
    
        verifyAuth.mockReturnValueOnce({flag : false})
        
        await logout(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith({ error :'Unauthorized'} 
            )
      })

});
