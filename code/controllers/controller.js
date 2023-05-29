import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = (req, res) => {
    try {
    
      const adminAuth = verifyAuth(req, res, {authType: "Admin"})
       if (!adminAuth.flag) return res.status(401).json({ error: adminAuth.cause});  //check the NUMBER
        const { type, color } = req.body;
        const new_categories = new categories({ type, color });
        new_categories.save()
            .then(data => res.json({data : data, message : res.locals.message}))  //res.locals.message
            .catch(err => { throw err })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
    export const updateCategory = (req, res) => {
        try {
          const cookie = req.cookies;
          if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" });
          }
      
          const categoryId = req.params.categoryId;
          const { newCategoryName } = req.body;
      
          // Update the category in the server/database using the categoryId
          categories.findByIdAndUpdate(categoryId, { name: newCategoryName }, { new: true })
            .then(updatedCategory => {
              if (!updatedCategory) {
                return res.status(404).json({ message: "Category not found" });
              }
              res.json(updatedCategory);
            })
            .catch(err => {
              throw err;
            });
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

          if (!verifyAuth(req, res, { authType: "Admin" })) return ;
          // check cookies
          const cookie = req.cookies;
          if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" });
          }
      
          // the variable is an array retrieved from the request body
          const cat = req.body.types;

      
          // Delete the category from the server/database using the categoryId
          
          
          // find all the categories that have the type given in the req.body.type parameter and delete the category
          // ---> if only one category per type or per color no foor loop needed. We have to check if color or type attribute are unique as tuple or as individual attribute
          for (const c of cat){
            console.log(c);
            const deleted = await categories.findOneAndDelete({type: c}).then((e) => console.log(e))
            .catch((error)=> {
                res.status(400);
            });
          }

          res.status(200).json({ message: "Category updated successfully" });
          
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
        if (!simpleAuth.flag) return res.status(401).json({ error: simpleAuth.cause});  //check the NUMBER

        let data = await categories.find({})

        let filter = [];
        if (data)filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

        return res.json({data: filter ,message : res.locals.message})
    } catch (error) {
        res.status(400).json({ error: error.message })
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
      
      const userAuth=verifyAuth(req, res, { authType: "User", username: req.params.username })
      if (!userAuth.flag) return res.status(400).json({ error: userAuth.cause });

        const { username, amount, type } = req.body;
        const new_transactions = new transactions({ username, amount, type });
        new_transactions.save()
            .then(data => res.json({data :data , message : res.locals.message}))
            .catch(err => { throw err })
    } catch (error) {
        res.status(400).json({ error: error.message })
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
        const adminAuth = verifyAuth(req, res, {authType: "Admin"})
        if (!adminAuth.flag) return res.status(401).json({ error: adminAuth.cause});  //check the NUMBER

        /**
         * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
         */
        transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            res.json({data : data , message : res.locals.message});
        }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
            const cookie = req.cookies;
            if (!cookie.accessToken) {
                return res.status(401).json({ message: "Unauthorized" }); // unauthorized
            }
    
            // Assuming you have a "transactions" collection or model to query from
            let data = await transactions.find({ userId: req.params.userId }); // Assuming userId is the field to match
            return res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
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
            
            const userAuth=verifyAuth(req, res, { authType: "User", username : req.params.username })
           if (!userAuth.flag) return res.status(400).json({ error: userAuth.cause });


            const user = await User.findOne({ "username": req.params.username })
            //if (!user) return res.status(401).json({ message: "User not found" })  //teoricamente non necessaria

            
            /**
             * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
             */
    
            //let type = req.params[2]
            //let username = req.params[1]
            
            /*
            for (const el in req.params){
                console.log(typeof req.params[el])
            }
            */
            transactions.aggregate([
                {$match: { type: req.params.category, username: req.params.username}},
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
                
                //{ $match: {type: req.params.category}},
            ]).then((result) => {
                let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                res.json({data :data , message : res.locals.message});
            }).catch(error => { throw (error) })
        } catch (error) {
            res.status(400).json({ error: error.message })
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

        const group = await Group.findOne({name : name});

        if(!group)
            return res.status(401).json({message : "Group not found"});

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

        let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }));

        const emails = [];

        for(const m of group.members)
            emails.push(m.email);

        async function check() {
            for (const t of data) {
                const user = await User.findOne({username: t.username});

                if (user && emails.some(e => e === user.email))
                    groupT.push(t);
            }
        }

        await check();

        res.status(200).json({data : groupT});
    } catch (error) {
        res.status(400).json({ error: error.message })
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

        const group = await Group.findOne({name : name});
        const category = await categories.findOne({type : type});

        if(!group)
            return res.status(401).json({message : "Group not found"});

        if(!category)
            return res.status(401).json({message : "Category not found"});

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

        for(const m of group.members)
            emails.push(m.email);

        async function check() {
            for (const t of data) {
                const user = await User.findOne({username: t.username});

                if (user && emails.some(e => e === user.email))
                    groupT.push(t);
            }
        }

        await check();

        res.status(200).json({data : groupT});
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
