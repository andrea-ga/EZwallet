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


      const { name , memberEmails } = req.body;
      const groupFind = await Group.findOne({ name : name });
      let members = memberEmails;  //change the name to have the same name of the model
      //error 401 is returned if there is already an existing group with the same name
      if (groupFind) return res.status(401).json({ message: "Group with the same name already exist" })
     
      let emailnot_founded =  []; 
      let emailAlready_inGroup = []; 
      let counter = 0 ;

      for(let i= 0 ; i< members.length; i++) 
      { let user = await User.findOne({email : members[i].email}); 
        console.log(user);
        if(!user)  //if the user is not present in the list of users
          {counter+=1; 
          emailnot_founded.push(members[i].email)
          console.log("not founded "+i);

          }
        else if (user) 
        {
           //check if is a group memeber list  TO COMPLETED
           if(true) 
           {
            //counter+=1;
            emailAlready_inGroup.push(members[i].email);
           }
           
           let mem = members[i].email;
           let id = user.id
           members[i] = {mem ,id};

        }
      } 
      console.log(members.length)  //DEBUG
      if (counter == members.length)res.status(401).json({message : "the `memberEmails` either do not exist or are already in a group"})
      const group = new Group({name, members})
      group.save()
      .then( () => res.json(   {
        group , 
        "alreadyInGroup" : emailAlready_inGroup, 
        "membersNotFound" : emailnot_founded 
      }))
      .catch(err => { throw err })
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
        const cookie = req.cookies;

        if(!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const user = await User.findOne({refreshToken: cookie.refreshToken});

        if(user.role !== "Admin") {
            return res.status(401).json({message: "User is not an Admin"});
        }

        const groups = await Group.find();
        res.status(200).json(groups);
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
        const cookie = req.cookies;

        if(!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const groupName = req.params.name;
        const group = await Group.findOne({name : groupName});

        if(!group)
            return res.status(401).json({message: "Group not found"});

        res.status(200).json(group);
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
        const cookie = req.cookies;

        if(!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const membersNotFound = [];
        const alreadyInGroup = [];
        const newMembers = [];

        for(const m of req.body.members) {
            const found = await User.findOne({email : m.email});
            const already = await Group.findOne({members: { $elemMatch : {email : m.email}}});

            if(!found)
                membersNotFound.push(m);
            else if(already)
                alreadyInGroup.push(m);
            else
                newMembers.push(found);
        }

        if(newMembers.length === 0)
            return res.status(401).json({message: "No new member"});

        const groupName = req.params.name;
        const group = await Group.findOneAndUpdate({name : groupName},
            { $push: {
                    members: newMembers
                }
            },
            {new : true}
        );

        if(!group)
            return res.status(401).json({message: "Group not found"});

        const finalGroup = {
            group: group,
            alreadyInGroup: alreadyInGroup,
            membersNotFound: membersNotFound
        }

        res.status(200).json(finalGroup);
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
        const name = group.name; 
        const members = group.members ;
        //find the group with the same name that is unique
        const groupFind = await Group.findOne({ name : name });
        if (!groupFind) return res.status(401).json({ message: "Group not found" })
        //check if all the users are inside the users list
        let count= 0; 
        for(let i = 0 ; i< members.length ; i++)
        { 
          if(!User.findOne({ "email" : members[i]}))count++  //if the email doesn't exist
          else if(!groupFind.members.includes(members[i]))count++
          else 
            continue
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
export const deleteGroup = async (req, res) => {   //still to implement Admin and not user
    try {
    const cookie = req.cookies;
      if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    const  name  = req.body.name;
    //find the group with the same name that is unique
    const groupFind = await Group.findOne({ name : name });
    //console.log(name);  //DEBUG
    if (!groupFind) return res.status(401).json({ message: "Group not found" })
    Group.deleteOne({name : name}).then(gr => res.status(200).json("correctly deleted"))
    .catch(err => { throw err }) 
    } catch (err) {
        res.status(500).json(err.message)
    }
}