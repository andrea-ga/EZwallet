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
       if (!verifyAuth(req, res, { authType: "Admin" })) return ;
        const { type, color } = req.body;
        const new_categories = new categories({ type, color });
        new_categories.save()
            .then(data => res.json({data : data}))
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
    function updateCategoryFunc(categoryName, newCategoryName) {
        // Find the index of the category with the given name
        const categoryIndex = ezwallet.categories.findIndex(
          (category) => category.name === categoryName
        );
        // If the category exists, update its name
        if (categoryIndex !== -1) {
          ezwallet.categories[categoryIndex].name = newCategoryName;
          console.log(`Category "${categoryName}" updated to "${newCategoryName}"`);
        } else {
          console.log(`Category "${categoryName}" not found`);
        }
      }
      
      export const updateCategory = async (req, res) => {
        try {
          if (!verifyAuth(req, res, { authType: "Admin" })) return ;
          // Call the updateCategory function with the provided parameters
          updateCategoryFunc(req.params.categoryName, req.body.newCategoryName);
          res.status(200).json({ message: "Category updated successfully" });
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
    function deleteCategoryFunc(categoryName) {
        // Find the index of the category with the given name
        const categoryIndex = ezwallet.categories.findIndex(
          (category) => category.name === categoryName
        );
        
        // If the category exists, remove it from the array
        if (categoryIndex !== -1) {
          ezwallet.categories.splice(categoryIndex, 1);
          console.log(`Category "${categoryName}" deleted`);
        } else {
          console.log(`Category "${categoryName}" not found`);
        }
      }
      
      export const deleteCategory = async (req, res) => {
        try {
          if (!verifyAuth(req, res, { authType: "Admin" })) return;
          // Call the deleteCategory function with the provided parameter
          deleteCategoryFunc(req.params.categoryName);
          res.status(200).json({ message: "Category deleted successfully" });
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
        const cookie = req.cookies
        const currentUser= await User.findOne({refreshToken: cookie.refreshToken}); 
        if (!verifyAuth(req, res, { authType: "User", currentUser : currentUser })) return res.status(400).json("Unauthorized");

        let data = await categories.find({})

        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

        return res.json(filter)
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
        const cookie = req.cookies
        const currentUser= await User.findOne({ "username" : req.params.username }); 
        if (!verifyAuth(req, res, { authType: "User", currentUser : currentUser })) return res.status(400).json("Unauthorized");
        const { username, amount, type } = req.body;
        const new_transactions = new transactions({ username, amount, type });
        new_transactions.save()
            .then(data => res.json(data))
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
        const cookie = req.cookies
        if (!verifyAuth(req, res, { authType: "Admin" })) return res.status(400).json("Only and Admin can access to this route");
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
            res.json(data);
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
    async function getTransactionByUserFunc(userId) {
        try {
          const transactions = await Transaction.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
          });
          return transactions;
        } catch (error) {
          console.error(error);
          throw new Error("Error retrieving transactions");
        }
      }
      
      export const getTransactionsByUser = async (req, res) => {
        try {
          const userId = req.params.userId;
          
          // Call the getTransactionByUser function to retrieve transactions for the user
          const transactions = await getTransactionByUserFunc(userId);
      
          res.status(200).json(transactions);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }
      


/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */

    export const getTransactionsByUserByCategory = async (req, res) => {
    
        console.log(req.params);
        try {
            const cookie = req.cookies
            if (!cookie.accessToken) {
                return res.status(401).json({ message: "Unauthorized" }) // unauthorized
            }

            const user = await User.findOne({ "username": req.params.username })
            if (!user) return res.status(401).json({ message: "User not found" })

            
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
                res.json(data);
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
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.json("deleted");
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
    
            if (!verifyAuth(req, res, { authType: "Admin" })) return res.status(400).json("Only and Admin can access to this route");
            const cookies = req.cookies
            const ids = req.body.ids
            for (const id of ids){
                let data = await transactions.deleteOne({ _id: id });
            }
            return res.json({message: "All the transaction deleted"});
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
}
