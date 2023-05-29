import { Router } from "express";
import { login, logout, register, registerAdmin } from "../controllers/auth.js";
import {
    createCategory, createTransaction, deleteTransaction,
    getCategories, getAllTransactions, getTransactionByUser, deleteCategory,
    getTransactionsByUserByCategory, deleteTransactions, getTransactionsByGroup, getTransactionsByGroupByCategory, updateCategory
} from "../controllers/controller.js";
import {
    getUsers, getUser, createGroup, getGroups, deleteGroup,
    getGroup, deleteUser, addToGroup, removeFromGroup
} from "../controllers/users.js";

const router = Router();

/**
 * Routes that do not require authentication
 */
router.post('/register', register)
router.post("/admin", registerAdmin)
router.post('/login', login)

/**
 * Routes for authenticated users
 */
router.get("/categories", getCategories) 
router.get("/users/:username", getUser)
router.post("/users/:username/transactions", createTransaction)
router.get("/users/:username/transactions", getTransactionByUser)
router.delete("/users/:username/transactions", deleteTransaction)
router.get("/users/:username/transactions/category/:category", getTransactionsByUserByCategory)
router.post("/groups", createGroup)
router.get("/groups/:name", getGroup)
router.get("/groups/:name/transactions", getTransactionsByGroup)
router.get("/groups/:name/transactions/category/:category", getTransactionsByGroupByCategory)
router.patch("/groups/:name/add", addToGroup)
router.patch("/groups/:name/remove", removeFromGroup)

/**
 * Admin-exclusive routes. The functions called are the same and must have different behaviors depending on the route.
 */
router.post("/categories", createCategory) //auth done, it is no present the validation of all the values
router.patch("/categories/:type", updateCategory) //auth done
router.delete("/categories", deleteCategory) //auth done
router.get("/transactions", getAllTransactions) //auth done
router.delete("/transactions", deleteTransactions) //auth done
router.get("/transactions/users/:username", getTransactionByUser)
router.get("/transactions/users/:username/category/:category", getTransactionsByUserByCategory)
router.get("/transactions/groups/:name", getTransactionsByGroup)
router.get("/transactions/groups/:name/category/:category", getTransactionsByGroupByCategory)
router.get('/users', getUsers)   //auth done
router.delete("/users", deleteUser) //auth done 
router.get("/groups", getGroups) //auth done
router.delete("/groups", deleteGroup) //auth done
router.patch("/groups/:name/insert", addToGroup)
router.patch("/groups/:name/pull", removeFromGroup)

/**
 * Logout
 */
router.get('/logout', logout)
export default router;