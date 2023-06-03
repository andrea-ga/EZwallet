import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, {authType: "Admin"});
        if (!adminAuth.flag)
            return res.status(401).json({ error: adminAuth.cause});

        const { type, color } = req.body;
        if(!type)
            return res.status(400).json({ error: "type field is empty"});
        if(!color)
            return res.status(400).json({ error: "color field is empty"});

        const found = await categories.findOne({type : type});
        if(found)
            return res.status(400).json({ error: "type already present"});

        const new_categories = new categories({type, color});
        const data = await new_categories.save();

        return res.status(200).json({data: {type: data.type, color: data.color}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
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
            const adminAuth = verifyAuth(req, res, {authType: "Admin"});
            if (!adminAuth.flag)
                return res.status(401).json({ error: adminAuth.cause});
      
          const previousType = req.params.type;
          const { type, color } = req.body;

          const category = await categories.findOne( {type: previousType});
          if (!category){
            return res.status(401).json({ message: "Category not found" });
          }
          
        
         const count = await transactions.updateMany(
            { type: previousType},
            { type: type, color: color},
            { upsert: true, }
         );
         
         
         await categories.updateOne(
            {type: previousType}, 
            {type: type, color: color},
            {upsert: true}
            );
            
         res.status(200).json({data: { message: "Category updated successfully", count: count.modifiedCount}});

        } catch (error) {
          res.status(400).json({ error: error.message });
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

          if (!verifyAuth(req, res, { authType: "Admin" })) 
            return ;
      
          const cat = req.body.types;

          // Delete the category from the server/database using the categoryId
          
          // find all the categories that have the type given in the req.body.type parameter and delete the category
          // ---> if only one category per type or per color no foor loop needed. We have to check if color or type attribute are unique as tuple or as individual attribute
          for (const c of cat){
            console.log(c);


            // updates all the transaction that have the transaction type as c
            transactions.updateMany(
                { type: c},
                { type: "investment"},
                {
                  upsert: true,
                  
                }
             )
            const cat = await categories.findOne({type: c});
            if (!cat){
                return res.status(401).json({message: "Category cat does not exist "});
            }
            
            const deleted = await categories.findOneAndDelete({type: c})
                                                .catch(()=> {
                                                        res.status(401).json({message: "Category does not exist"});
                                                }
                                                );
          }

          res.status(200).json( {data: { message: "Category updated successfully" }});
          
        } catch (error) {
          res.status(400).json({ error: error.message });
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
        const simpleAuth = verifyAuth(req, res, {authType: "Simple"});
        if (!simpleAuth.flag)
            return res.status(401).json({ error: simpleAuth.cause});

        const data = await categories.find({});

        let filter = [];
        if (data)
            filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }));

        return res.status(200).json({data: filter , refreshedTokenMessage : res.locals.refreshedTokenMessage});
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
        const param_user = await User.findOne({username: req.params.username});
        if(!param_user)
            return res.status(400).json({error: "route param user does not exist"});

        const userAuth= verifyAuth(req, res, { authType: "User", username: req.params.username });
        if (!userAuth.flag)
            return res.status(401).json({error: userAuth.cause});

        const { username, amount, type } = req.body;
        if(!username)
            return res.status(400).json({error: "username field is empty"});
        if(!type)
            return res.status(400).json({error: "type field is empty"});
        if(isNaN(amount))
            return res.status(400).json({error: "amount field is not a number"});

        const user = await User.findOne({username: username});
        if(!user)
            return res.status(400).json({error: "req body user does not exist"});

        if(username !== param_user.username)
            return res.status(400).json({error: "req body user and route param user don't match"});

        const category = await categories.findOne({type: type});
        if(!category)
            return res.status(400).json({error: "category does not exist"});

        const new_transactions = new transactions({ username, amount, type });

        const data = await new_transactions.save();
        return res.status(200).json({data : { username: data.username, type: data.type,
                amount: data.amount, date: data.date } , refreshedTokenMessage : res.locals.refreshedTokenMessage});
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
            return res.status(401).json({ error: adminAuth.cause});

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

        const data = result.map(v => Object.assign({}, { username: v.username,
                amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }));
        return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
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
            const userAuth=verifyAuth(req, res, { authType: "Admin" })
            if (!userAuth.flag) return res.status(400).json({ error: userAuth.cause });

            const user = await User.findOne({ "username": req.params.username })
            if (!user){
                return res.status(401).json({error: "User does not exist"});
            }

        
        const result = await transactions.aggregate([
            {
                $match: { 
                    username: req.params.username
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
            { $unwind: "$categories_info" }
        ]);

        const data = result.map(r => Object.assign({}, { _id: r._id, username: r.username,
                                                          type: r.type, amount: r.amount, date: r.date, 
                                                        color: r.categories_info.color }
                                                        )
                                );
        return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
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

        const user = await User.findOne({ username: req.params.username });
        if(!user)
            return res.status(400).json({ error: "user does not exist" });

        if(regExp.test(req.url)) {
            const adminAuth = verifyAuth(req, res, { authType: "Admin" });
            if (!adminAuth.flag)
                return res.status(401).json({ error: adminAuth.cause});
        } else {
            const userAuth= verifyAuth(req, res, { authType: "User", username : req.params.username });
            if (!userAuth.flag)
                return res.status(401).json({ error: userAuth.cause });
        }

        const category = await categories.findOne({ type: req.params.category });
        if(!category)
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

        if(result.length !== 0)
            user_transactions = result.map(v => Object.assign({}, {username: v.username,
                amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }));
            return res.status(200).json({data : user_transactions , refreshedTokenMessage: res.locals.refreshedTokenMessage});
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
        if(regExp.test(req.url)) {
            const adminAuth = verifyAuth(req, res, {authType: "Admin"})
            if (!adminAuth.flag)
                return res.status(401).json({error : adminAuth.cause});

            const group = await Group.findOne({name: name});
            if (!group)
                return res.status(400).json({error: "Group not found"});

            for(const m of group.members)
                emails.push(m.email);
        } else {
            const group = await Group.findOne({name: name});
            if (!group)
                return res.status(400).json({error: "Group not found"});

            const groupAuth = verifyAuth(req, res, {authType: "Group", emails: group.members});
            if (!groupAuth.flag)
                return res.status(401).json({error: groupAuth.cause});

            for(const m of group.members)
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

        const data = result.map(v => Object.assign({}, {username: v.username, amount: v.amount,
            type: v.type, color: v.categories_info.color, date: v.date }));

        async function check() {
            for (const t of data) {
                const user = await User.findOne({username: t.username});

                if (user && emails.some(e => e === user.email))
                    groupT.push(t);
            }
        }

        await check();

        return res.status(200).json({data : groupT, refreshedTokenMessage : res.locals.refreshedTokenMessage});
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
        let data = [];
        const name = req.params.name;
        const type = req.params.category;
        let group = null;

        const regExp = new RegExp("^(\/transactions\/)"); //Admin-only route
        if(regExp.test(req.url)) {
            const adminAuth = verifyAuth(req, res, {authType: "Admin"})
            if (!adminAuth.flag)
                return res.status(401).json({error : adminAuth.cause});

            group = await Group.findOne({name: name});
            if (!group)
                return res.status(400).json({error: "Group not found"});
        } else {
            group = await Group.findOne({name: name});
            if (!group)
                return res.status(400).json({error: "Group not found"});

            const groupAuth = verifyAuth(req, res, {authType: "Group", emails: group.members});
            if (!groupAuth.flag)
                return res.status(401).json({error: groupAuth.cause});
        }

        const category = await categories.findOne({type : type});
        if(!category)
            return res.status(400).json({error : "Category not found"});

        const usernames = [];
        const emails = group.members.map(m => m.email);
        for(const e of emails) {
            const user = await User.findOne({email : e});
            if(user)
                usernames.push(user.username);
        }

        const result = await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" },
            { $match: { type: type , username: { $in: usernames } } }
        ]);

        if(result.length !== 0)
            data = result.map(v => Object.assign({}, { username: v.username,
                amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }));

        return res.status(200).json({data : data, refreshedTokenMessage : res.locals.refreshedTokenMessage});
    } catch (error) {
        return res.status(500).json({ error: error.message })
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

       const userAuth=verifyAuth(req, res, { authType: "User", username : req.params.username })
       if (!userAuth.flag) return res.status(400).json({ error: userAuth.cause });

        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.json({data : "success" , message : res.locals.message });
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */

export const deleteTransactions = async (req, res) => {
        try {
    
            const adminAuth = verifyAuth(req, res, {authType: "Admin"})
            if (!adminAuth.flag) return res.status(401).json({ error: adminAuth.cause});  //check the NUMBER
  
            const ids = req.body.ids
            for (const id of ids){
                let data = await transactions.deleteOne({ _id: id });
            }
            return res.json({data : "All the transaction deleted" , message : res.locals.message});
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
}
