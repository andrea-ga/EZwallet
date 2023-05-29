import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User } from "../models/User.js";
import { createCategory, getCategories, createTransaction } from "../controllers/controller.js";
import { verifyAuth } from "../controllers/utils.js";

jest.mock('../models/model');
jest.mock("../controllers/utils.js");

beforeEach(() => {
  categories.find.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.prototype.save.mockClear();
});

describe("createCategory", () => {
    test('should return the new category', async () => {
        const mockReq = {body : {type: "type1", color: "color1"}};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newCategory = {type: "type1", color: "color1"};
        jest.spyOn(categories, "findOne").mockResolvedValue(null);
        jest.spyOn(categories.prototype, "save").mockResolvedValue(newCategory);
        verifyAuth.mockReturnValue({authorized : true});

        await createCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalled();
        expect(categories.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: newCategory,
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('Unauthorized access', async () => {
        const mockReq = {body : {type: "type1", color: "color1"}};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newCategory = {type: "type1", color: "color1"};
        jest.spyOn(categories, "findOne").mockResolvedValue("");
        jest.spyOn(categories.prototype, "save").mockResolvedValue(newCategory);
        verifyAuth.mockReturnValue({authorized : false, cause: "Unauthorized"});
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});
    });

    test('raise exception', async () => {
        const mockReq = {body : {type: "type1", color: "color1"}};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "findOne").mockResolvedValue("");
        categories.prototype.save.mockImplementation(() => {
            throw new Error("Internal error");
        })
        verifyAuth.mockReturnValue({authorized : true});
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalled();
    });

    test('empty type field', async () => {
        const mockReq = {body : {type: "", color: "color1"}};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "findOne").mockResolvedValue("");
        verifyAuth.mockReturnValue({authorized : true});
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "type field is empty"});
    });

    test('empty color field', async () => {
        const mockReq = {body : {type: "type1", color: ""}};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "findOne").mockResolvedValue("");
        verifyAuth.mockReturnValue({authorized : true});
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "color field is empty"});
    });

    test('type already present', async () => {
        const mockReq = {body : {type: "type1", color: "color1"}};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        verifyAuth.mockReturnValue({authorized : true});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "type already present"});
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
    test('should return empty list if there are no categories', async () => {
        const mockReq = {};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "find").mockResolvedValue([]);
        verifyAuth.mockReturnValue({authorized : true});

        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('should retrieve list of all categories', async () => {
        const mockReq = {};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedCategories = [{type: "type1", color: "color1"},
            {type: "type2", color: "color2"}];
        jest.spyOn(categories, "find").mockResolvedValue(retrievedCategories);
        verifyAuth.mockReturnValue({authorized : true});

        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: retrievedCategories,
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('Unauthorized access', async () => {
        const mockReq = {};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        verifyAuth.mockReturnValue({authorized : false, cause: "Unauthorized"});

        await getCategories(mockReq, mockRes);

        expect(categories.find).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Unauthorized"
        });
    });

    test('raise exception', async () => {
        const mockReq = {};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedCategories = [[{type: "type1", color: "color1"},
            {type: "type2", color: "color2"}]]
        jest.spyOn(categories, "find").mockResolvedValue(retrievedCategories);
        verifyAuth.mockReturnValue({authorized : true});
        categories.find.mockImplementation(() => {
            throw new Error("Internal error");
        })

        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({error: "Internal error"});
    });
})

describe("createTransaction", () => {
    test('should return the new transaction', async () => {
        const mockReq = {body: {username: "test1", type: "type1", amount: 100},
                                                             params: [{username: "test1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized: true});

        await createTransaction(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(transactions.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data: newTransaction,
                                                    refreshedTokenMessage: mockRes.locals.refreshedTokenMessage});
    });

    test('Unauthorized access', async () => {
        const mockReq = {body: {username: "test", type: "type1", amount: 100},
                                        params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : false, cause: "Unauthorized"});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});
    });

    test('raise exception', async () => {
        const mockReq = {body : {username: "test1", type: "type1", amount: 100},
                            params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        transactions.prototype.save.mockImplementation(() => {
            throw new Error("Internal error");
        })
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(transactions.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalled();
    });

    test('empty username field', async () => {
        const mockReq = {body : {username: "", type: "type1", amount: 100},
                                    params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "username field is empty"});
    });

    test('empty type field', async () => {
        const mockReq = {body : {username: "test1", type: "", amount: 100},
                            params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "type field is empty"});
    });

    test('amount field is not a number', async () => {
        const mockReq = {body : {username: "test1", type: "type1", amount: "amount"},
                            params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "amount field is not a number"});
    });

    test('route param user not found', async () => {
        const mockReq = {body : {username: "test1", type: "type1", amount: 100},
                            params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValueOnce("")
            .mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "route param user does not exist"});
    });

    test('req body user not found', async () => {
        const mockReq = {body : {username: "test1", type: "type1", amount: 100},
            params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValueOnce({ username: 'test1', email: 'test1@example.com', role : 'Admin' })
            .mockResolvedValue("");
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "req body user does not exist"});
    });

    test('req body user and route param user dont match', async () => {
        const mockReq = {body : {username: "test1", type: "type1", amount: 100},
            params: [{username: "test2"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValueOnce({ username: 'test2', email: 'test2@example.com', role : 'Admin' })
            .mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1"});
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "req body user and route param user don't match"});
    });

    test('category not found', async () => {
        const mockReq = {body : {username: "test1", type: "type1", amount: 100},
                            params: [{username: "test1"}]};
        const mockRes = {
            status : jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = {username: "test1", type: "type1", amount: 100};
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role : 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue("");
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({authorized : true});
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "category does not exist"});
    });
})

describe("getAllTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUser", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUserByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroup", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
