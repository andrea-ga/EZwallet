import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User, Group } from "../models/User.js";
import {
    createCategory, getCategories, createTransaction,
    getAllTransactions, getTransactionsByGroup, getTransactionsByGroupByCategory, getTransactionsByUserByCategory,
    deleteCategory, updateCategory
    , deleteTransactions, deleteTransaction, getTransactionsByUser
} from "../controllers/controller.js";
import { verifyAuth, handleAmountFilterParams,handleDateFilterParams } from "../controllers/utils.js";
import e from 'express';

jest.mock('../models/model');
jest.mock("../controllers/utils.js");
jest.mock("../models/User.js");

beforeEach(() => {
    categories.find.mockClear();
    categories.prototype.save.mockClear();
    transactions.find.mockClear();
    transactions.deleteOne.mockClear();
    transactions.aggregate.mockClear();
    transactions.prototype.save.mockClear();
});

describe("createCategory", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('should return the new category', async () => {
        const mockReq = { body: { type: "type1", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newCategory = { type: "type1", color: "color1" };
        jest.spyOn(categories, "findOne").mockResolvedValue(null);
        jest.spyOn(categories.prototype, "save").mockResolvedValue(newCategory);
        verifyAuth.mockReturnValue({ flag: true });

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
        const mockReq = { body: { type: "type1", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newCategory = { type: "type1", color: "color1" };
        jest.spyOn(categories, "findOne").mockResolvedValue("");
        jest.spyOn(categories.prototype, "save").mockResolvedValue(newCategory);
        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test('raise exception', async () => {
        const mockReq = { body: { type: "type1", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "findOne").mockResolvedValue("");
        categories.prototype.save.mockImplementation(() => {
            throw new Error("Internal error");
        })
        verifyAuth.mockReturnValue({ flag: true });
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalled();
    });

    test('empty type field', async () => {
        const mockReq = { body: { type: "", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "findOne").mockResolvedValue("");
        verifyAuth.mockReturnValue({ flag: true });
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "type field is empty" });
    });

    test('empty color field', async () => {
        const mockReq = { body: { type: "type1", color: "" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "findOne").mockResolvedValue("");
        verifyAuth.mockReturnValue({ flag: true });
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "color field is empty" });
    });

    test('type already present', async () => {
        const mockReq = { body: { type: "type1", color: "color1" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        verifyAuth.mockReturnValue({ flag: true });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        await createCategory(mockReq, mockRes);

        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "type already present" });
    });
})

describe("updateCategory", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test('Admin request to update existing category with transactions', async () => {
        const mockReq = {
            params: {
                type: 'food',
            },
            body: {
                type: 'Food',
                color: 'yellow',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockCategory = {
            type: 'food',
        };

        const mockCount = {
            modifiedCount: 2,
        };

        const mockTransactions = {
            updateMany: jest.fn().mockResolvedValue(mockCount),
        };

        const mockCategories = {
            findOne: jest.fn().mockResolvedValue(mockCategory),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
        };

        verifyAuth.mockReturnValue({ flag: true });
        categories.findOne.mockResolvedValueOnce(mockCategory);
        categories.findOne.mockResolvedValueOnce(null);
        transactions.updateMany.mockResolvedValueOnce(mockCount);
        await updateCategory(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'Food' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: { message: 'Category updated successfully', count: 2 },
            refreshedTokenMessage: undefined,
        });

    });

    test('Admin request to update existing category without transactions', async () => {
        const mockReq = {
            params: {
                type: 'food',
            },
            body: {
                type: 'Food',
                color: 'yellow',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockCategory = {
            type: 'food',
        };

        const mockCount = {
            modifiedCount: 0,
        };

        const mockTransactions = {
            updateMany: jest.fn().mockResolvedValue(mockCount),
        };

        const mockCategories = {
            findOne: jest.fn().mockResolvedValue(mockCategory),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
        };

        verifyAuth.mockReturnValue({ flag: true });

        categories.findOne.mockResolvedValueOnce(mockCategory);
        categories.findOne.mockResolvedValueOnce(null);
        transactions.updateMany.mockResolvedValue(mockCount);
        const transactionsSpy = jest.spyOn(transactions, 'updateMany');

        await updateCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'Food' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: { message: 'Category updated successfully', count: 0 },
            refreshedTokenMessage: undefined,
        });
        expect(transactionsSpy).toHaveBeenCalledWith({ type: 'food' }, { type: 'Food' });
        expect(mockCategories.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('Admin request to update non-existing category', async () => {
        const mockReq = {
            params: {
                type: 'nonexisting',
            },
            body: {
                type: 'Nonexisting',
                color: 'blue',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };


        const mockCategory = null;
        verifyAuth.mockReturnValue({ flag: true });

        categories.findOne.mockResolvedValueOnce(mockCategory);

        await updateCategory(mockReq, mockRes);

        expect(categories.findOne).toHaveBeenCalledWith({ type: 'nonexisting' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Category not found'
        });
    });

    test('Admin request to update category with missing request body attributes', async () => {
        const mockReq = {
            params: {
                type: 'food',
            },
            body: {
                color: 'yellow',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockCategory = {
            type: 'food',
        };

        const mockAlreadyPresent = null;

        const mockCount = {
            modifiedCount: 0,
        };

        const mockTransactions = {
            updateMany: jest.fn().mockResolvedValue(mockCount),
        };

        const mockCategories = {
            findOne: jest.fn().mockResolvedValue(mockCategory),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
        };

        verifyAuth.mockReturnValue({ flag: true });
        categories.findOne.mockResolvedValue(mockCategory);
        await updateCategory(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Invalid request"
        });
        expect(mockCategories.updateOne).not.toHaveBeenCalled();
        expect(mockCategories.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('Non-admin request to update category', async () => {
        const mockReq = {
            params: {
                type: 'food',
            },
            body: {
                type: 'Food',
                color: 'yellow',
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValue({
            flag: false,
            cause: "Unauthorized"
        });

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Unauthorized"
        });
    });
});

describe("deleteCategory", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    /*
      test('Admin request to delete existing categories with transactions', async () => {
        const mockReq = {
          body: {
            types: ['health', 'food'],
          },
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined,
          },
        };
        const mockCategoriesFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue([{ type: 'health' },
                { type: 'food' },
                { type: 'category3' },
                { type: 'category4' },])
            })
          })
        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        categories.countDocuments.mockResolvedValueOnce(4); // 4 categories in the database
        categories.findOne.mockResolvedValueOnce({ type: 'health' }); // first category
        categories.findOne.mockResolvedValueOnce({ type: 'food' }); // second category
        categories.find=mockCategoriesFind;
        categories.findOneAndDelete.mockResolvedValueOnce({ type: 'health' }); // delete first category
        categories.findOneAndDelete.mockResolvedValueOnce({ type: 'food' }); // delete second category
        categories.find.mockResolvedValueOnce([{ type: 'category3' }, { type: 'category4' }]); // updated categories after deletion
        transactions.updateMany.mockResolvedValueOnce(); // update transactions with new category
    
        await deleteCategory(mockReq, mockRes);
    
        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'health' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(categories.find).toHaveBeenCalled();
        expect(categories.findOneAndDelete).toHaveBeenCalledWith({ type: 'health' });
        expect(categories.findOneAndDelete).toHaveBeenCalledWith({ type: 'food' });
        expect(transactions.updateMany).toHaveBeenCalledWith({ type: 'health' }, { type: 'category3' });
        expect(transactions.updateMany).toHaveBeenCalledWith({ type: 'food' }, { type: 'category3' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: { message: 'Categories deleted', count: 2 },
          refreshedTokenMessage: undefined,
        });
      });
    
      test.only('Admin request to delete existing categories without transactions', async () => {
        const mockReq = {
          body: {
            types: ['health', 'food'],
          },
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined,
          },
        };
        const mockCategoriesFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue([{ type: 'health' },
                { type: 'food' },
                { type: 'category3' },
                { type: 'category4' },])
            })
          })
        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        categories.countDocuments.mockResolvedValueOnce(4); // 4 categories in the database
        categories.findOne.mockResolvedValueOnce({ type: 'health' }); // first category
        categories.findOne.mockResolvedValueOnce({ type: 'food' }); // second category
        categories.findOne.mockResolvedValueOnce({ type: 'category3' }); // third category
        categories.findOne.mockResolvedValueOnce({ type: 'category4' }); // fourth category
        categories.find = mockCategoriesFind;
        categories.findOneAndDelete.mockResolvedValueOnce({ type: 'health' }); // delete first category
        categories.findOneAndDelete.mockResolvedValueOnce({ type: 'food' }); // delete second category
        categories.find.mockResolvedValueOnce([{ type: 'category3' }, { type: 'category4' }]); // updated categories after deletion
        transactions.updateMany.mockResolvedValueOnce(); // update transactions with new category
    
        await deleteCategory(mockReq, mockRes);
    
        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'health' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'category3' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'category4' });
        expect(categories.find).toHaveBeenCalled();
        expect(categories.findOneAndDelete).toHaveBeenCalledWith({ type: 'health' });
        expect(categories.findOneAndDelete).toHaveBeenCalledWith({ type: 'food' });
        expect(transactions.updateMany).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: { message: 'Categories deleted', count: 2 },
          refreshedTokenMessage: undefined,
        });
      }); */

    test('Admin request to delete non-existing categories', async () => {
        const mockReq = {
            body: {
                types: ['category1', 'category2'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        categories.countDocuments.mockResolvedValueOnce(4); // 4 categories in the database
        categories.findOne.mockResolvedValueOnce(undefined); // first category does not exist

        await deleteCategory(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'category1' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Category does not exist' });
    });
    test('Admin request to delete more categories than present in the database', async () => {
        const mockReq = {
            body: {
                types: ['category1', 'category2', 'category3', 'category4'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        categories.countDocuments.mockResolvedValueOnce(2); // 2 categories in the database

        await deleteCategory(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cannot delete more categories than the ones present' });
    });

    test('Admin request to delete the only category in the database', async () => {
        const mockReq = {
            body: {
                types: ['category1'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        categories.countDocuments.mockResolvedValueOnce(1); // 1 category in the database

        await deleteCategory(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cannot delete the only category present' });
    });

    test('Non-admin request to delete categories', async () => {
        const mockReq = {
            body: {
                types: ['category1', 'category2'],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" }); // non-admin

        await deleteCategory(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('Invalid request with missing types', async () => {
        const mockReq = {
            body: {},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        await deleteCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid request' });
    });

    test('Invalid request with empty type', async () => {
        const mockReq = {
            body: {
                types: ['category1', ''],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        await deleteCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid request' });
    });
})

describe("getCategories", () => {
    test('should return empty list if there are no categories', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(categories, "find").mockResolvedValue([]);
        verifyAuth.mockReturnValue({ flag: true });

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
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedCategories = [{ type: "type1", color: "color1" },
        { type: "type2", color: "color2" }];
        jest.spyOn(categories, "find").mockResolvedValue(retrievedCategories);
        verifyAuth.mockReturnValue({ flag: true });

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
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });

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
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedCategories = [[{ type: "type1", color: "color1" },
        { type: "type2", color: "color2" }]]
        jest.spyOn(categories, "find").mockResolvedValue(retrievedCategories);
        verifyAuth.mockReturnValue({ flag: true });
        categories.find.mockImplementation(() => {
            throw new Error("Internal error");
        })

        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal error" });
    });
})

describe("createTransaction", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('should return the new transaction', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });

        await createTransaction(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(transactions.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: newTransaction,
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('Unauthorized access', async () => {
        const mockReq = {
            body: { username: "test", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test('raise exception', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        transactions.prototype.save.mockImplementation(() => {
            throw new Error("Internal error");
        })
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(transactions.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalled();
    });

    test('empty username field', async () => {
        const mockReq = {
            body: { username: "", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "username field is empty" });
    });

    test('empty type field', async () => {
        const mockReq = {
            body: { username: "test1", type: "", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "type field is empty" });
    });

    test('amount field is not a number', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: "amount" },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "amount field is not a number" });
    });

    test('route param user not found', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValueOnce("")
            .mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "route param user does not exist" });
    });

    test('req body user not found', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValueOnce({ username: 'test1', email: 'test1@example.com', role: 'Admin' })
            .mockResolvedValue("");
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "req body user does not exist" });
    });

    test('req body user and route param user dont match', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: 100 },
            params: [{ username: "test2" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValueOnce({ username: 'test2', email: 'test2@example.com', role: 'Admin' })
            .mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "req body user and route param user don't match" });
    });

    test('category not found', async () => {
        const mockReq = {
            body: { username: "test1", type: "type1", amount: 100 },
            params: [{ username: "test1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const newTransaction = { username: "test1", type: "type1", amount: 100, date: "2023-05-14T14:27:59.045Z" };
        jest.spyOn(User, "findOne").mockResolvedValue({ username: 'test1', email: 'test1@example.com', role: 'Admin' });
        jest.spyOn(categories, "findOne").mockResolvedValue("");
        jest.spyOn(transactions.prototype, "save").mockResolvedValue(newTransaction);
        verifyAuth.mockReturnValue({ flag: true });
        await createTransaction(mockReq, mockRes);

        expect(transactions.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "category does not exist" });
    });
})

describe("getAllTransactions", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('should return empty list if there are no transactions', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
        verifyAuth.mockReturnValue({ flag: true });

        await getAllTransactions(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('should retrieve list of all transactions', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type2", color: "color2" }
            }];
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: true });

        await getAllTransactions(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [{ username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" },
            { username: "test", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2" }],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('Unauthorized access', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type2", color: "color2" }
            }];
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });

        await getCategories(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Unauthorized"
        });
    });

    test('raise exception', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type2", color: "color2" }
            }];
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: true });
        transactions.aggregate.mockImplementation(() => {
            throw new Error("Internal error");
        })

        await getAllTransactions(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal error" });
    });
})

describe("getTransactionsByUser", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return transactions for admin route', async () => {
        const mockReq = {
            url: '/transactions/users/Mario',
            params: {username : "Mario"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockAuth = { flag: true };
        const mockUser = { username: 'Mario' };
        const mockTransactions = [
            { username: 'Mario', amount: 100, type: 'food', date: '2023-05-19T00:00:00', color: 'red' },
            { username: 'Mario', amount: 70, type: 'health', date: '2023-05-19T10:00:00', color: 'green' },
        ];

        verifyAuth.mockReturnValue(mockAuth);
        User.findOne.mockResolvedValue(mockUser);
        transactions.aggregate.mockResolvedValue(mockTransactions);

        await getTransactionsByUser(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'Mario' });
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: mockTransactions,
            refreshedTokenMessage: undefined,
        });
    });

    test('should return transactions for user route with date and amount filters', async () => {
        const mockReq = {
            url: '/users/Mario/transactions?min=10&upTo=2023-05-10',
            params: {username : "Mario"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        const mockAuth = { flag: true };
        const mockUser = { username: 'Mario' };
        const mockTransactions = [
            { username: 'Mario', amount: 100, type: 'food', date: '2023-05-19T00:00:00', color: 'red' },
            { username: 'Mario', amount: 70, type: 'health', date: '2023-05-19T10:00:00', color: 'green' },
        ];

        verifyAuth.mockReturnValue(mockAuth);
        User.findOne.mockResolvedValue(mockUser);
        transactions.aggregate.mockResolvedValue(mockTransactions);
        handleDateFilterParams.mockReturnValue({ date: { $lte: '2023-05-10T00:00:00.000Z' } });
        handleAmountFilterParams.mockReturnValue({ amount: { $gte: 10 } });

        await getTransactionsByUser(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'User', username: 'Mario' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'Mario' });
        expect(handleDateFilterParams).toHaveBeenCalledWith(mockReq);
        expect(handleAmountFilterParams).toHaveBeenCalledWith(mockReq);
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: mockTransactions,
            refreshedTokenMessage: undefined,
        });
    });

    test('should return 400 error if user does not exist', async () => {
        const mockReq = {
            url: '/transactions/users/Mario',
            params: {username : "Mario"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const mockAuth = { flag: true };

        verifyAuth.mockReturnValue(mockAuth);
        User.findOne.mockResolvedValue(null);

        await getTransactionsByUser(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'Mario' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'User does not exist' });
    });

    test('should return 401 error for unauthorized user', async () => {
        const mockReq = {
            url: '/users/Mario/transactions',
            params: {username : "Mario"}
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const mockAuth = { flag: false, cause: 'Unauthorized' };

        verifyAuth.mockReturnValueOnce({flag : false}).mockReturnValueOnce(mockAuth);

        await getTransactionsByUser(mockReq, mockRes);
        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'Admin' });
        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: 'User', username: 'Mario' });
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });


})

describe("getTransactionsByUserByCategory", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('admin route - should return empty list if there are no transactions for that user and category', async () => {
        const mockReq = {
            url: "transactions/users/test/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "admin" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('admin route - should return list of transactions for that user and category', async () => {
        const mockReq = {
            url: "transactions/users/test/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            }];
        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "admin" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [{ username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" },
            { username: "test", amount: 50, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" }],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('user route - should return empty list if there are no transactions for that user and category', async () => {
        const mockReq = {
            url: "/users/test/transactions/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "user" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        })
    });

    test('user route - should return list of transactions for that user and category', async () => {
        const mockReq = {
            url: "/users/test/transactions/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            }];
        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "user" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: [{ username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" },
            { username: "test", amount: 50, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" }],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        });
    });

    test('admin route - should return 500 if there is an error', async () => {
        const mockReq = {
            url: "transactions/users/test/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "admin" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {
            throw new Error("Internal error");
        });
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Internal error"
        });
    });

    test('user route - should return 500 if there is an error', async () => {
        const mockReq = {
            url: "users/test/transactions/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "user" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {
            throw new Error("Internal error");
        });
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Internal error"
        });
    });

    test('admin route - should return 401 if user is not authorized', async () => {
        const mockReq = {
            url: "transactions/users/test/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            }];
        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "admin" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Unauthorized"
        });
    });

    test('user route - should return 401 if user is not authorized', async () => {
        const mockReq = {
            url: "users/test/transactions/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        const retrievedTransactions = [
            {
                username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            },
            {
                username: "test", amount: 50, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: { type: "type1", color: "color1" }
            }];
        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "user" });
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({ flag: false, cause: "Unauthorized" });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Unauthorized"
        });
    });

    test('admin route - should return 400 if user does not exist', async () => {
        const mockReq = {
            url: "transactions/users/test/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        jest.spyOn(User, "findOne").mockResolvedValue(null);
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(null);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "user does not exist"
        });
    });

    test('user route - should return 400 if user does not exist', async () => {
        const mockReq = {
            url: "users/test/transactions/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        jest.spyOn(User, "findOne").mockResolvedValue(null);
        jest.spyOn(categories, "findOne").mockResolvedValue({ type: "type1", color: "color1" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(null);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "user does not exist"
        });
    });

    test('admin route - should return 400 if category does not exist', async () => {
        const mockReq = {
            url: "transactions/users/test/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "admin" });
        jest.spyOn(categories, "findOne").mockResolvedValue(null);
        jest.spyOn(transactions, "aggregate").mockResolvedValue(null);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "category does not exist"
        });
    });

    test('user route - should return 400 if category does not exist', async () => {
        const mockReq = {
            url: "users/test/transactions/category/type1",
            params: [{ username: "test", category: "type1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "test", email: "test@test.com", role: "user" });
        jest.spyOn(categories, "findOne").mockResolvedValue(null);
        jest.spyOn(transactions, "aggregate").mockResolvedValue(null);
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByUserByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "category does not exist"
        });
    });
})

describe("getTransactionsByGroup", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('admin route - should return empty list if there are no group transactions', async () => {
        const mockReq = {
            url: "transactions/groups/group1",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
        jest.spyOn(User, "findOne")
            .mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
                .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data:
                [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        }
        );
    });

    test('admin route - should retrieve list of all group transactions', async () => {
        const mockReq = {
            url: "transactions/groups/group1",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data:
                [{ username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" },
                { username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2" },
                { username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2" }],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        }
        );
    });

    test('user route - should return empty list if there are no group transactions', async () => {
        const mockReq = {
            url: "groups/group1/transactions",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
        jest.spyOn(User, "findOne")
            .mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test@test.com", role: "Regular"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data:
                [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        }
        );
    });

    test('user route - should retrieve list of all group transactions', async () => {
        const mockReq = {
            url: "groups/group1/transactions",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data:
                [{ username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1" },
                { username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2" },
                { username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z", color: "color2" }],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
        }
        );
    });

    test('admin route - Unauthorized access', async () => {
        const mockReq = {
            url: "transactions/groups/group1",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test('user route - Unauthorized access', async () => {
        const mockReq = {
            url: "groups/group1/transactions",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test('admin route - Group not found', async () => {
        const mockReq = {
            url: "transactions/groups/group1",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue("");
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Group not found" });
    });

    test('user route - Group not found', async () => {
        const mockReq = {
            url: "groups/group1/transactions",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue("");
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroup(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Group not found" });
    });

    test('admin route - raise exception', async () => {
        const mockReq = {
            url: "transactions/groups/group1",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        transactions.aggregate.mockImplementation(() => {
            throw new Error("Internal error");
        })
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByGroup(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal error" });
    });

    test('user route - raise exception', async () => {
        const mockReq = {
            url: "groups/group1/transactions",
            params: [{ name: "group1" }]
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}},
            {username: "test2", amount: 200, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 50, type: "type2", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type2", color: "color2"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "Regular"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        transactions.aggregate.mockImplementation(() => {
            throw new Error("Internal error");
        })
        verifyAuth.mockReturnValue({ flag: true });

        await getTransactionsByGroup(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal error" });
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('admin route - should return the list of transactions for that group and category', async () => {
        const mockReq = {url: "/transactions/groups/group1/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValueOnce({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(categories, "findOne").mockResolvedValueOnce({type: "type1", color: "color1"});
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(transactions, "aggregate").mockResolvedValueOnce(retrievedTransactions);

        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled()
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:
                [{username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
                    {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
                    {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"}],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage}
        );
    });

    test('user route - should return the list of transactions for that group and category', async () => {
        const mockReq = {url: "/groups/group1/transactions/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValueOnce({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(categories, "findOne").mockResolvedValueOnce({type: "type1", color: "color1"});
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
        .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
   
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled()
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:
                [{username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
                    {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"},
                    {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z", color: "color1"}],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage}
        );
    });

    test('admin route - should return empty list if there are no group transactions for that category', async () => {
        const mockReq = {url: "/transactions/groups/group1/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled()
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:
                [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage}
        );
    });

    test('user route - should return empty list if there are no group transactions for that category', async () => {
        const mockReq = {url: "/groups/group1/transactions/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(Group.findOne).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled()
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data:
                [],
            refreshedTokenMessage: mockRes.locals.refreshedTokenMessage}
        );
    });

    test('admin route - Unauthorized access', async () => {
        const mockReq = {url: "/transactions/groups/group1/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test('user route - Unauthorized access', async () => {
        const mockReq = {url: "/groups/group1/transactions/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test('admin route - Group not found', async () => {
        const mockReq = {url: "/transactions/groups/group1/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue(null);
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Group not found" });
    });

    test('user route - Group not found', async () => {
        const mockReq = {url: "/groups/group1/transactions/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue(null);
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Group not found" });
    });

    test('admin route - Category not found', async () => {
        const mockReq = {url: "/transactions/groups/group1/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue(null);
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Category not found" });
    });

    test('user route - Category not found', async () => {
        const mockReq = {url: "/groups/group1/transactions/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        const retrievedTransactions = [
            {username: "test", amount: 100, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}},
            {username: "test3", amount: 150, type: "type1", date: "2023-05-14T14:27:59.045Z",
                categories_info: {type: "type1", color: "color1"}}];

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockResolvedValue(retrievedTransactions);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue(null);
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Category not found" });
    });

    test('admin route - raise exception', async () => {
        const mockReq = {url: "/transactions/groups/group1/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {
            throw new Error("Internal error")
        });
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal error" });
    });

    test('user route - raise exception', async () => {
        const mockReq = {url: "/groups/group1/transactions/category/type1",
            params: [{name: "group1", category: "type1"}]};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined
            }
        }

        jest.spyOn(Group, "findOne").mockResolvedValue({name : "group1", members: [{email: "test@test.com"},
                {email: "test3@test.com"}]});
        jest.spyOn(transactions, "aggregate").mockImplementation(() => {
            throw new Error("Internal error");
        });
        jest.spyOn(User, "findOne").mockResolvedValueOnce({username: "test", email: "test@test.com", role: "User"})
            .mockResolvedValueOnce({username: "test3", email: "test3@test.com", role: "Admin"});
        jest.spyOn(categories, "findOne").mockResolvedValue({type: "type1", color: "color1"});
        verifyAuth.mockReturnValue({flag: true});

        await getTransactionsByGroupByCategory(mockReq, mockRes);

        expect(transactions.aggregate).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal error" });
    });
})

describe("deleteTransaction", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test("User request to delete an existing transaction", async () => {
        const mockReq = {
            params: {
                username: "Mario",
            },
            body: {
                _id: "6hjkohgfc8nvu786",
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // user
        User.findOne.mockResolvedValueOnce({ username: "Mario" }); // user found
        transactions.findOne.mockResolvedValueOnce({
            _id: "6hjkohgfc8nvu786",
            username: "Mario",
        }); // transaction found
        transactions.deleteOne.mockResolvedValueOnce(); // delete transaction

        await deleteTransaction(mockReq, mockRes);


        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(transactions.findOne).toHaveBeenCalledWith({
            _id: "6hjkohgfc8nvu786",
        });
        expect(transactions.deleteOne).toHaveBeenCalledWith({
            _id: "6hjkohgfc8nvu786",
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: { message: "Transaction deleted" },
            refreshedTokenMessage: undefined,
        });

    });

    test("User request to delete a non-existing transaction", async () => {
        const mockReq = {
            params: {
                username: "Mario",
            },
            body: {
                _id: "6hjkohgfc8nvu786",
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // user
        User.findOne.mockResolvedValueOnce({ username: "Mario" }); // user found
        transactions.findOne.mockResolvedValueOnce(undefined); // transaction not found

        await deleteTransaction(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, {
            authType: "User",
            username: "Mario",
        });
        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(transactions.findOne).toHaveBeenCalledWith({
            _id: "6hjkohgfc8nvu786",
        });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Transaction not deleted",
        });
    });

    test("User request to delete a transaction of a different user", async () => {
        const mockReq = {
            params: {
                username: "Mario",
            },
            body: {
                _id: "6hjkohgfc8nvu786",
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // user
        User.findOne.mockResolvedValueOnce({ username: "Luigi" }); // different user found

        await deleteTransaction(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, {
            authType: "User",
            username: "Mario",
        });
        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Transaction not deleted",
        });
    });

    test("User request with missing _id", async () => {
        const mockReq = {
            params: {
                username: "Mario",
            },
            body: {},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // user

        await deleteTransaction(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, {
            authType: "User",
            username: "Mario",
        });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Missing _id",
        });
    });

    test("Authenticated user request to delete a transaction of another user", async () => {
        const mockReq = {
            params: {
                username: "Mario",
            },
            body: {
                _id: "6hjkohgfc8nvu786",
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" }); // unauthenticated

        await deleteTransaction(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, {
            authType: "User",
            username: "Mario",
        });
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: "Unauthorized"
        });
    });
})

describe("deleteTransactions", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Admin request to delete existing transactions", async () => {
        const mockReq = {
            body: {
                _ids: ["transaction1", "transaction2"],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        transactions.findOne.mockResolvedValueOnce({ _id: "transaction1" }); // first transaction
        transactions.findOne.mockResolvedValueOnce({ _id: "transaction2" }); // second transaction
        transactions.deleteMany.mockResolvedValueOnce(); // delete transactions

        await deleteTransactions(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: "transaction1" });
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: "transaction2" });
        expect(transactions.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["transaction1", "transaction2"] } });
        expect(mockRes.json).toHaveBeenCalledWith({ data: { message: "All transactions deleted" }, refreshedTokenMessage: undefined });
    });

    test("Admin request to delete non-existing transactions", async () => {
        const mockReq = {
            body: {
                _ids: ["transaction1", "transaction2"],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        transactions.findOne.mockResolvedValueOnce(undefined); // first transaction does not exist

        await deleteTransactions(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: "transaction1" });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid id" });
    });

    test("Non-admin request to delete transactions", async () => {
        const mockReq = {
            body: {
                _ids: ["transaction1", "transaction2"],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" }); // non-admin

        await deleteTransactions(mockReq, mockRes);

        expect(verifyAuth).toHaveBeenCalledWith(mockReq, mockRes, { authType: "Admin" });
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("Invalid request with missing _ids", async () => {
        const mockReq = {
            body: {},
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin

        await deleteTransactions(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Missing ids" });
    });

    test("Invalid request with empty _id", async () => {
        const mockReq = {
            body: {
                _ids: ["transaction1", ""],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin

        await deleteTransactions(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid id" });
    });

    test("Internal server error", async () => {
        const mockReq = {
            body: {
                _ids: ["transaction1"],
            },
        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: undefined,
            },
        };

        verifyAuth.mockReturnValueOnce({ flag: true }); // admin
        transactions.findOne.mockRejectedValueOnce(new Error("Database error"));

        await deleteTransactions(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Database error" });
    });
})
