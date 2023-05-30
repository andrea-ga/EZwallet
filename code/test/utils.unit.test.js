import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken';

jest.mock('../models/User.js');



describe("handleDateFilterParams", () => {
    test('from filter', () => {
        const mockReq = {url : "localhost:3000/api/users/test/transactions?from=2023-04-30",
                        query: {from: "2023-04-30"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: "2023-04-30T00:00:00.000Z"}});
    });

    test('upTo filter', () => {
        const mockReq = {url : "localhost:3000/api/users/test/transactions?upTo=2023-05-10",
            query: {upTo: "2023-05-10"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$lte: "2023-05-10T23:59:59.000Z"}});
    });

    test('date filter', () => {
        const mockReq = {url : "localhost:3000/api/users/test/transactions?date=2023-05-10",
            query: {date: "2023-05-10"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: "2023-05-10T00:00:00.000Z",
                $lte: "2023-05-10T23:59:59.000Z"}});
    });

    test('from and upTo filters', () => {
        const mockReq = {
            url : "localhost:3000/api/users/test/transactions?from=2023-04-30&upTo=2023-05-10",
            query: {from: "2023-04-30", upTo: "2023-05-10"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: "2023-04-30T00:00:00.000Z",
                $lte: "2023-05-10T23:59:59.000Z"}});
    });

    test('date and upTo filters', () => {
        try {
            const mockReq = {
                url : "localhost:3000/api/users/test/transactions?date=2023-04-30&upTo=2023-05-10",
                query: {date: "2023-04-30", upTo: "2023-05-10"}};

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong query format");
        }
    });

    test('date and from filters', () => {
        try {
            const mockReq = {
                url : "localhost:3000/api/users/test/transactions?from=2023-04-30&date=2023-05-10",
                query: {from: "2023-04-30", date: "2023-05-10"}};

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong query format");
        }
    });

    test('wrong date - from filter', () => {
        try {
            const mockReq = {
                url: "localhost:3000/api/users/test/transactions?from=2023-04-",
                query: {from: "2023-04-"}
            };

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong date format");
        }
    });

    test('wrong date - upTo filter', () => {
        try {
            const mockReq = {
                url: "localhost:3000/api/users/test/transactions?upTo=2023-05-",
                query: {upTo: "2023-05-"}
            };

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong date format");
        }
    });

    test('wrong date - date filter', () => {
        try {
            const mockReq = {
                url: "localhost:3000/api/users/test/transactions?date=2023-05-",
                query: {date: "2023-05-"}
            };

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong date format");
        }
    });
})

describe("verifyAuth", () => { 
    beforeEach(() => {
        jest.resetAllMocks();
    
      });
    test("No cookie", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        let info = {authType : "Simple"}
        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Unauthorized" })
    })
  test("Simple auth", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = "Simple"
        let decodedAccessToken = { username : "us02" , email : "us@02.com" , role : "Regular"}
        let decodedRefreshToken = { username : "us02" , email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: true, cause: "authorized" })
    })
    test("Simple wrong decoded token on access", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = "Simple"
        let decodedAccessToken = {  email : "us@02.com" , role : "Regular"}
        let decodedRefreshToken = { username : "us02" , email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({  flag: false, cause: "Token is missing information"})
    })
    test("Simple wrong decoded token on refresh", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = "Simple"
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "Regular"}
        let decodedRefreshToken = {  email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({  flag: false, cause: "Token is missing information"})
    })
    test("Simple wrong corrispondence between token", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = "Simple"
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "Regular"}
        let decodedRefreshToken = { username : "us03", email : "us@03.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({  flag: false, cause: "Mismatched users"})
    })
    
    test("Admin auth", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = {authType : "Admin"}
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "Admin"}
        let decodedRefreshToken = { username : "us02", email : "us@02.com" , role : "Admin"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({   flag: true, cause: "authorized" })
    })
    test("Admin auth wrong token", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = {authType : "Admin"}
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "User"}
        let decodedRefreshToken = { username : "us02", email : "us@02.com" , role : "User"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({flag: false, cause: "Unauthorized" })
    })
    test("User auth", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = {authType : "User", username : "us02"}
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "User"}
        let decodedRefreshToken = { username : "us02", email : "us@02.com" , role : "User"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({flag: true, cause: "authorized"})
    })
    test("User auth wrong token", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = {authType : "User", username : "us03"}
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "User"}
        let decodedRefreshToken = { username : "us02", email : "us@02.com" , role : "User"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({flag: false, cause: "Unauthorized" })
    })

    test("Group auth ", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = {authType : "Group", emails : [{email : "us@02.com"},{email : "us@03.com"},{email : "us@04.com"}]}
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "User"}
        let decodedRefreshToken = { username : "us02", email : "us@02.com" , role : "User"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({flag: true, cause: "authorized"  })
    })
    test("Group auth wrong ", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          }
        }
        const info = {authType : "Group", emails : [{email : "us@03.com"},{email : "us@04.com"}]}
        let decodedAccessToken = {  username : "us02", email : "us@02.com" , role : "User"}
        let decodedRefreshToken = { username : "us02", email : "us@02.com" , role : "User"}
        jest.spyOn(jwt, 'verify').mockReturnValueOnce(decodedAccessToken).mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Unauthorized" })
    })

    test("Token expired then okay User", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "User", username : "us02"}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: true, cause: "authorized"  })
    })
    test("Token expired then no okay User", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "User", username : "us03"}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Unauthorized"  })
    })
    test("Token expired Admin ok", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Admin", username : "us02"}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Admin"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: true, cause: "authorized"  })
    })
    test("Token expired Admin no ok", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Admin"}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Unauthorized"  })
    })
    test("Token expired Group ok", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Group", emails : [{email : "us@02.com"},{email : "us@04.com"}]}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: true, cause: "authorized"  })
    })
    test("Token expired Simple ok", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Group", emails : [{email : "us@03.com"},{email : "us@04.com"}]}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Unauthorized"  })
    })
    test("Token expired Group no ok", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Simple"}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            .mockReturnValueOnce(decodedRefreshToken)

        jest.spyOn(jwt, 'sign').mockReturnValueOnce(decodedRefreshToken)

        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: true, cause: "authorized"  })
    })
    test("2 Tokens expired ", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Group", emails : [{email : "us@03.com"},{email : "us@04.com"}]}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})})
            .mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})} )
            
        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Perform login again"  })
    })

    test(" token expire plus other error", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Group", emails : [{email : "us@03.com"},{email : "us@04.com"}]}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'TokenExpiredError'})})
            .mockImplementationOnce( () => {throw Object.assign({}, {name :'Server error'})} )
            
        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Server error" })
    })
    test(" token expire plus other error", async () => {
        const mockReq = {
          cookies : {
            accessToken : "1234",
            refreshToken : "5678"
          }
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
          cookie : jest.fn()
        }
        const info = {authType : "Group", emails : [{email : "us@03.com"},{email : "us@04.com"}]}
        let decodedRefreshToken = {id: "id123", username : "us02", email : "us@02.com" , role : "Regular"}
        jest.spyOn(jwt, 'verify').mockImplementationOnce( () => {throw Object.assign({}, {name :'Server error'})})
            
        let value = verifyAuth(mockReq, mockRes, info)

        expect(value).toStrictEqual({ flag: false, cause: "Server error" })
    })
})

describe("handleAmountFilterParams", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
