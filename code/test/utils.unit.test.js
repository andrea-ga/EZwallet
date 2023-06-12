import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken';

jest.mock('../models/User.js');



describe("handleDateFilterParams", () => {
    test('from filter', () => {
        const mockReq = {url : "users/test/transactions?from=2023-04-30",
                        query: {from: "2023-04-30"}};

        const d = new Date("2023-04-30T00:00:00.000Z");

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: d}});
    });

    test('upTo filter', () => {
        const mockReq = {url : "users/test/transactions?upTo=2023-05-10",
            query: {upTo: "2023-05-10"}};

        const d = new Date("2023-05-10T23:59:59.000Z");

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$lte: d}});
    });

    test('date filter', () => {
        const mockReq = {url : "users/test/transactions?date=2023-05-10",
            query: {date: "2023-05-10"}};

        const d1 = new Date("2023-05-10T00:00:00.000Z");
        const d2 = new Date("2023-05-10T23:59:59.000Z");

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: d1,
                $lte: d2}});
    });

    test('from and upTo filters', () => {
        const mockReq = {
            url : "users/test/transactions?from=2023-04-30&upTo=2023-05-10",
            query: {from: "2023-04-30", upTo: "2023-05-10"}};

        const d1 = new Date("2023-04-30T00:00:00.000Z");
        const d2 = new Date("2023-05-10T23:59:59.000Z");

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: d1,
                $lte: d2}});
    });

    test('date and upTo filters', () => {
        try {
            const mockReq = {
                url : "users/test/transactions?date=2023-04-30&upTo=2023-05-10",
                query: {date: "2023-04-30", upTo: "2023-05-10"}};

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong query format");
        }
    });

    test('date and from filters', () => {
        try {
            const mockReq = {
                url : "users/test/transactions?from=2023-04-30&date=2023-05-10",
                query: {from: "2023-04-30", date: "2023-05-10"}};

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong query format");
        }
    });

    test('wrong date - from filter', () => {
        try {
            const mockReq = {
                url: "users/test/transactions?from=2023-04-",
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
                url: "users/test/transactions?upTo=2023-05-",
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
                url: "users/test/transactions?date=2023-05-",
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
    test('min filter', () => {
        const mockReq = {url : "users/test/transactions?min=10",
            query: {min: "10"}};

        expect(handleAmountFilterParams(mockReq)).toStrictEqual({amount: {$gte: 10}});
    });

    test('max filter', () => {
        const mockReq = {url : "users/test/transactions?max=50",
            query: {max: "50"}};

        expect(handleAmountFilterParams(mockReq)).toStrictEqual({amount: {$lte: 50}});
    });

    test('max and min filter', () => {
        const mockReq = {url : "users/test/transactions?min=10&max=50",
            query: {min: "10", max: "50"}};

        expect(handleAmountFilterParams(mockReq)).toStrictEqual({amount: {$gte: 10, $lte: 50}});
    });

    test('min is not a number', () => {
        try {
            const mockReq = {
                url: "users/test/transactions?min=ab",
                query: {min: "ab"}
            };

            handleAmountFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("the min amount value is not a number");
        }
    });

    test('max is not a number', () => {
        try {
            const mockReq = {
                url: "users/test/transactions?max=ab",
                query: {max: "ab"}
            };

            handleAmountFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("the max amount value is not a number");
        }
    });
})
