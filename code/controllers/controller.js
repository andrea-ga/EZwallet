import { type } from "os";
import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";
import jwt from 'jsonwebtoken'
/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!adminAuth.flag)
            return res.status(401).json({ error: adminAuth.cause });

        const { type, color } = req.body;
        if (!type)
            return res.status(400).json({ error: "type field is empty" });
        if (!color)
            return res.status(400).json({ error: "color field is empty" });

        const found = await categories.findOne({ type: type });
        if (found)
            return res.status(400).json({ error: "type already present" });

        const new_categories = new categories({ type, color });
        const data = await new_categories.save();

        return res.status(200).json({ data: { type: data.type, color: data.color }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!adminAuth.flag)
            return res.status(401).json({ error: adminAuth.cause });

        const previousType = req.params.type;
        const { type, color } = req.body;

        const category = await categories.findOne({ type: previousType });
        if (!category) {
            return res.status(400).json({ error: "Category not found" });
        }
        if (!type || !color || type === "" || color === "") {
            return res.status(400).json({ error: "Invalid request" })
        }
        const alreadyPresent = await categories.findOne({ type: type });
        if (alreadyPresent) {
            return res.status(400).json({ error: "Category already present" });
        }

        const count = await transactions.updateMany(
            { type: previousType },
            { type: type },
        );


        await categories.updateOne(
            { type: previousType },
            { type: type, color: color },
        );

        res.status(200).json({ data: { message: "Category updated successfully", count: count.modifiedCount }, refreshedTokenMessage: res.locals.refreshedTokenMessage });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (adminAuth.flag === false)
            return res.status(401).json({ error: adminAuth.cause });

        const { types } = req.body
        let count = 0;
        // Delete the category from the server/database using the categoryId
        if (!types || types.length === 0 || types.includes("")) {
            return res.status(400).json({ error: "Invalid request" });
        }
        // find all the categories that have the type given in the req.body.type parameter and delete the category
        // ---> if only one category per type or per color no foor loop needed. We have to check if color or type attribute are unique as tuple or as individual attribute
        let num_cat = await categories.countDocuments();
        if (num_cat <= 1) {
            return res.status(400).json({ error: "Cannot delete the only category present" });
        }

        if (types.length > num_cat) {
            return res.status(400).json({ error: "Cannot delete more categories than the ones present" });
        }
        for (let type of types) {
            const cat = await categories.findOne({ type: type });
            if (!cat) {
                return res.status(400).json({ message: "Category does not exist" });
            }
        }
        //find all the transactions sorted from the oldest to the newest
        let foundCategories = await categories.find({}).sort({ createdAt: 1 }).select({ type: 1, _id: 0 });
        if (types.length < num_cat) {
            for (let type of types) {

                let c = await categories.findOneAndDelete({ type: type });
                count += 1;
            }
            let foundCategories = await categories.find({}).sort({ createdAt: 1 }).limit(1).select({ type: 1, _id: 0 });
            for (let type of types) {

                await transactions.updateMany({
                    type: type
                }, {
                    type: foundCategories[0].type
                })
            }
        }
        if (types.length === num_cat) {
            let foundCategories = await categories.find({}).sort({ createdAt: 1 }).limit(1).select({ type: 1, _id: 0 });

            for (let type of types) {

                if (type != foundCategories[0].type) {
                    await categories.findOneAndDelete({ type: type });
                    count += 1
                }
                await transactions.updateMany({
                    type: type
                }, {
                    type: foundCategories[0].type
                })
            }
        }

        res.status(200).json({ data: { message: "Categories deleted", count: count }, refreshedTokenMessage: res.locals.refreshedTokenMessage });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {
        const simpleAuth = verifyAuth(req, res, { authType: "Simple" });
        if (!simpleAuth.flag)
            return res.status(401).json({ error: simpleAuth.cause });

        const data = await categories.find({});

        let filter = [];
        if (data)
            filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }));

        return res.status(200).json({ data: filter, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {
        const param_user = await User.findOne({ username: req.params.username });
        if (!param_user)
            return res.status(400).json({ error: "route param user does not exist" });

        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });
        if (!userAuth.flag)
            return res.status(401).json({ error: userAuth.cause });

        const { username, amount, type } = req.body;
        if (!username)
            return res.status(400).json({ error: "username field is empty" });
        if (!type)
            return res.status(400).json({ error: "type field is empty" });
        if (isNaN(amount))
            return res.status(400).json({ error: "amount field is not a number" });

        const user = await User.findOne({ username: username });
        if (!user)
            return res.status(400).json({ error: "req body user does not exist" });

        if (username !== param_user.username)
            return res.status(400).json({ error: "req body user and route param user don't match" });

        const category = await categories.findOne({ type: type });
        if (!category)
            return res.status(400).json({ error: "category does not exist" });

        const new_transactions = new transactions({ username, amount, type });

        const data = await new_transactions.save();
        return res.status(200).json({
            data: {
                username: data.username, type: data.type,
                amount: data.amount, date: data.date
            }, refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        if (!adminAuth.flag)
            return res.status(401).json({ error: adminAuth.cause });

        const result = await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]);

        const data = result.map(v => Object.assign({}, {
            _id: v._id, username: v.username,
            amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date
        }));
        return res.status(200).json({ data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */

export const getTransactionByUser = async (req, res) => {
    try {
        //regexp fot the url /api/transactions/users/Mario
        let adminURL = /^\/transactions\/users\/([^/]+)$/;
        //regexp for the url of the normal user /api/users/:username/transactions?amount with possible other params
        let userURL = /^\/users\/([^/]+)\/transactions(?:\?([^/]+))?$/;
        const userAuth = verifyAuth(req, res, { authType: "Admin" })
        let date = {};
        let amount = {};
        if (userAuth.flag && adminURL.test(req.url)) {

        }
        else if (userURL.test(req.url)) {
            const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });
            if (!userAuth.flag) {
                return res.status(401).json({ error: userAuth.cause });
            }
            date = handleDateFilterParams(req)
            amount = handleAmountFilterParams(req)
             if(Object.keys(date.date).length==0)
            date = {}
        if(Object.keys(amount.amount).length==0)
            amount = {}
        }
        else {
            return res.status(401).json({ error: "Unauthorized" });
            
        }

        const user = await User.findOne({ "username": req.params.username })
        if (!user) {
            return res.status(400).json({ error: "User does not exist" });
        }
        
       

        const result = await transactions.aggregate([
            {
                $match: {
                    $and: [
                    {username: user.username},
                     date,
                       amount
                ]
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" },
            {
                $project: {
                _id: 0,

                username: 1,
                amount: 1,
                type: 1,
                date: 1,
                color: "$categories_info.color"
                }
            }
        ]);
        //const result = await transactions.find({ username: req.params.username })              
return res.status(200).json({ data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage });
        // Assuming you have a "transactions" collection or model to query from
        //  let data = await transactions.find({ userId: req.params.userId }); // Assuming userId is the field to match
        //  return res.json(data);
    } catch (error) {
    res.status(500).json({ error: error.message });
}
};

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    try {
        const regExp = new RegExp("^(\/transactions\/)"); //Admin-only route
        let user_transactions = [];

        if (regExp.test(req.url)) {
            const adminAuth = verifyAuth(req, res, { authType: "Admin" });
            if (!adminAuth.flag)
                return res.status(401).json({ error: adminAuth.cause });
        } else {
            const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });
            if (!userAuth.flag)
                return res.status(401).json({ error: userAuth.cause });
        }

        const user = await User.findOne({ username: req.params.username });
        if (!user)
            return res.status(400).json({ error: "user does not exist" });

        const category = await categories.findOne({ type: req.params.category });
        if (!category)
            return res.status(400).json({ error: "category does not exist" });

        const result = await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info",
                }
            },
            { $unwind: "$categories_info" },
            { $match: { username: req.params.username, type: req.params.category } }
        ]);

        if (result.length !== 0)
            user_transactions = result.map(v => Object.assign({}, {
                _id: v._id, username: v.username,
                amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date
            }));
        return res.status(200).json({ data: user_transactions, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    try {
        const name = req.params.name;
        const emails = [];

        const regExp = new RegExp("^(\/transactions\/)"); //Admin-only route
        if (regExp.test(req.url)) {
            const adminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (!adminAuth.flag)
                return res.status(401).json({ error: adminAuth.cause });

            const group = await Group.findOne({ name: name });
            if (!group)
                return res.status(400).json({ error: "Group not found" });

            for (const m of group.members)
                emails.push(m.email);
        } else {
            const group = await Group.findOne({ name: name });
            if (!group)
                return res.status(400).json({ error: "Group not found" });

            const groupAuth = verifyAuth(req, res, { authType: "Group", emails: group.members });
            if (!groupAuth.flag)
                return res.status(401).json({ error: groupAuth.cause });

            for (const m of group.members)
                emails.push(m.email);
        }

        const groupT = [];

        const result = await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]);

        const data = result.map(v => Object.assign({}, {
            username: v.username, amount: v.amount,
            type: v.type, color: v.categories_info.color, date: v.date
        }));

        async function check() {
            for (const t of data) {
                const user = await User.findOne({ username: t.username });

                if (user && emails.some(e => e === user.email))
                    groupT.push(t);
            }
        }

        await check();

        return res.status(200).json({ data: groupT, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {
        const name = req.params.name;
        const type = req.params.category;

        const group = await Group.findOne({ name: name });
        const category = await categories.findOne({ type: type });

        if (!group)
            return res.status(401).json({ message: "Group not found" });

        if (!category)
            return res.status(401).json({ message: "Category not found" });

        const groupT = [];

        const result = await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]);

        let data = result.filter(t => t.type === type).map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }));

        const emails = [];

        for (const m of group.members)
            emails.push(m.email);

        async function check() {
            for (const t of data) {
                const user = await User.findOne({ username: t.username });

                if (user && emails.some(e => e === user.email))
                    groupT.push(t);
            }
        }

        await check();

        res.status(200).json({ data: groupT, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {

        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
        if (!userAuth.flag) return res.status(401).json({ error: userAuth.cause });
        let { _id } = req.body;

        if (!_id || _id === "")
            return res.status(400).json({ error: "Missing _id" });
        let user = await User.findOne({ username: req.params.username });
        if (!user)
            return res.status(400).json({ error: "User not found" });

        let transactionfound = await transactions.findOne({ _id: _id });
        if (!transactionfound || transactionfound.username !== user.username)
            return res.status(400).json({ error: "Transaction not deleted" });

        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.status(200).json({ data: { message: "Transaction deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const deleteTransactions = async (req, res) => {
    try {

        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (!adminAuth.flag)
            return res.status(401).json({ error: adminAuth.cause });

        const { _ids } = req.body
        if (!_ids || _ids.length === 0)
            return res.status(400).json({ error: "Missing ids" });

        for (let id of _ids) {
            if (id === "")
                return res.status(400).json({ error: "Invalid id" });
            let valid = await transactions.findOne({ _id: id });
            if (!valid)
                return res.status(400).json({ error: "Invalid id" });
        }
        await transactions.deleteMany({ _id: { $in: _ids } });

        return res.json({ data: { message: "All transactions deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}