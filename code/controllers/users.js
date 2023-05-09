import { group } from "console";
import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error.message);
    }
}

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const username = req.params.username
        const user = await User.findOne({ refreshToken: cookie.refreshToken })
        if (!user) return res.status(401).json({ message: "User not found" })
        if (user.username !== username) return res.status(401).json({ message: "Unauthorized" })
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
    try {
      const cookie = req.cookies;
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }


      const { name , membersEmails } = req.body;
      const groupFind = await Group.findOne({ name : name });
      //error 401 is returned if there is already an existing group with the same name
      if (groupFind) return res.status(401).json({ message: "Group with the same name already exist" })
     
      let emailnot_founded =  []; 
      let emailAlready_inGroup = []; 
      let counter = 0 ;
      for(let i= 0 ; i< membersEmails.length; i++) 
      { let user = await User.find({email : membersEmails[i].email}); 
        if(!user)  //if the user is not present in the list of users
          {counter+=1; 
          email_notfounded.push(membersEmails[i].email)
          }
        else if (user) 
        {
           //check if is a group memeber list  TO COMPLETED
           if(true) 
           {
            //counter+=1;
            emailAlready_inGroup.push(membersEmails[i].email);
           }

        }
      }
      if (counter == membersEmails.lenght)res.status(401).json({message : "the `memberEmails` either do not exist or are already in a group"})
      const group = await Group.create({
        name, 
        membersEmails  //there in an error -> it doesn't save the list of users
      });
     console.log(membersEmails);
     res.status(200).json(group);
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
    try {
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
    try {
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
    try {
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
    try {
      const cookie = req.cookies;
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const { group , notInGroup , membersNotFound } = req.body;
        const name = group.name; //members that are present
        const members = group.members ;
        //find the group with the same name that is unique
        const groupFind = await Group.findOne({ name : name });
        if (!groupFind) return res.status(401).json({ message: "Group not found" })
        //check if all the users are inside the users list
        let count= 0; 
        for(let i = 0 ; i< members.length ; i++)
        {
          if(!groupFind.members.includes(members[i]))count++
        }
        if(count==members.length)return res.status(401).json({ message: "Users are not present in the Group user list" })
        //we don't controll the user that will be deleted but only if the remaining users were in the list 
        //even in the previous version
        Group.replaceOne(groupFind, group);  //replace the older group with the new one 
        //NOT SURE
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
    try {
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
    try {
      if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    console.log("DELETEGROUP");
    const { name } = req.body;
    //find the group with the same name that is unique
    const groupFind = await Group.findOne({ name : name });
    if (!groupFind) return res.status(401).json({ message: "Group not found" })
    Group.remove({name : name})
      res.status(200).json({message : "Group successful deleted"})
    } catch (err) {
        res.status(500).json(err.message)
    }
}