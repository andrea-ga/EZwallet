import { group } from "console";
import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import { timingSafeEqual } from "crypto";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
    try {

      const adminAuth = verifyAuth(req, res, {authType: "Admin"})
      if (!adminAuth.authorized) 
        return res.status(401).json({ error: adminAuth.cause});  //check the NUMBER

        let user = await User.find();
        let users=user.map( e =>  ({ "username" : e.username ,"email" :  e.email , "role" : e.role}) ) ; 
        return res.status(200).json({data : users , message : res.locals.message});
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
        if(userAuth.authorized) //the admin call this method
        { 

        }
        else 
        {
          const adminAuth = verifyAuth(req, res, { authType: "Admin" })
          if(!adminAuth.authorized)
            return res.status(401).json({ error: adminAuth.cause});
        }

          let currentUser= await User.findOne({username : req.params.username});
          if (!currentUser) 
            return res.status(401).json({ error: "User not found" }); //useless 
        
        let find = { "username" : currentUser.username ,"email" :  currentUser.email , "role" : currentUser.role}
        res.status(200).json({data : find , message : res.locals.message})
    } catch (error) {
        res.status(500).json({ error: error.message })
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
      


      //need to manage the create group
      const userAuth=verifyAuth(req, res, { authType: "User", username : req.params.username })
      if (!userAuth.authorized) return res.status(400).json({ error: userAuth.cause });


      const { name , memberEmails } = req.body;
      const groupFind = await Group.findOne({ name : name });
      let members = [];  //change the name to have the same name of the model
      //error 401 is returned if there is already an existing group with the same name
      if (groupFind) return res.status(401).json({ message: "Group with the same name already exist" })
     
      let emailnot_founded =  []; 
      let emailAlready_inGroup = []; 
      let counter = 0 ;

      for(let i= 0 ; i< memberEmails.length; i++) 
      { let user = await User.findOne({email : memberEmails[i].email}); 
        if(!user)  //if the user is not present in the list of users
          {
            counter+=1; 
            emailnot_founded.push(memberEmails[i].email);
          }
        else if (user) 
        {     
          let find = await Group.findOne( 
              {
                members : {$elemMatch : { "email" : user.email }}
              }
            );
            
           if(find) 
           {
            counter+=1;
            emailAlready_inGroup.push(memberEmails[i].email);
           }
           else 
           {
           members.push( user );
           }
        }
      } 
      if (counter === memberEmails.length)return res.status(401).json({message : "the `memberEmails` either do not exist or are already in a group"})
      else 
      {
        const group = new Group({name, members});
      group.save()
      .then( () => res.json({data : {
        group , 
        "alreadyInGroup" : emailAlready_inGroup, 
        "membersNotFound" : emailnot_founded 
      }, 
    message  : res.locals.message  
    }))
      .catch(err => { throw err })
      }
    } catch (err) {
        res.status(500).json({error: err.message})
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

      const adminAuth = verifyAuth(req, res, {authType: "Admin"}); 
      if (!adminAuth.authorized) return res.status(401).json({ error: adminAuth.cause});
        
        const group = await Group.find();
        let groups = group.map (e => ( {"name"  :  e.name, "members" : e.members} ) );
        res.status(200).json({data : groups, message  : res.locals.message});
    } catch (err) {
        res.status(500).json({error: err.message})
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

      const group = await Group.findOne({name : req.params.name});
      const adminAuth = verifyAuth(req, res, {authType: "Admin"}); 
      if (adminAuth.authorized) {
        if(!group)res.status(401).json({ error: "Group not found" });
      }
      else 
      {
        if(!group)res.status(401).json({ error: "Group not found" });
        const groupAuth = verifyAuth(req, res, {authType: "Group", emails: group.members});
        if(!groupAuth.authorized)return res.status(401).json({ error: groupAuth.cause});
      } 
      res.status(200).json({data : group , message  : res.locals.message});
    } catch (err) {
        res.status(500).json({error : err.message})
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
        
        const reAd = new RegExp("*/api/groups/*/insert");
        const reUs = new RegExp("*/api/groups/*/add");
        let groupfind ;

        const adminAuth = verifyAuth(req, res, {authType: "Admin"}); 

        if (adminAuth.authorized && reAd.test(req.url)) // regexp for the URL 
        {
          groupFind  = await Group.findOne({name : req.params.name});
          if(!groupFind) res.status(401).json({error: "Group not found"});
        }
        else if (reUs.test(req.url)) //regexp for the URL
        {
          groupFind  = await Group.findOne({name : req.params.name});
          let groupAuth = verifyAuth(req, res, { authType: "Group" , emaials : groupFind.members})
          if ( !group.authorized) return res.status(401).json({ error: groupAuth.cause});
        }
        else // useless
        {
          return res.status(401).json({ message: "Unauthorized" });
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

        res.status(200).json({data : finalGroup , message : res.locals.message});
    } catch (err) {
        res.status(500).json({error : err.message})
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
        const reAd = new RegExp("*/api/groups/*/pull");
        const reUs = new RegExp("*/api/groups/*/remove");
        const cookie = req.cookies
        
        const name =req.params.name; 
        const members = req.body.members ;

      let  groupFind  = await Group.findOne({name : req.params.name});
      let adminAuth = verifyAuth(req, res, { authType: "Admin" });
        
      if(adminAuth.authorized && reAd.test(req.url)) // regexp for the URL 
      {
        if(!groupFind) return res.status(401).json({ message: "Group not found" });
      }
      else if (reUs.test(req.url)) //regexp for the URL
      {
        if (!groupFind) return res.status(401).json({ message: "Group not found" })
        let groupAuth = verifyAuth(req, res, { authType: "Group" , emails : groupFind.members});
        if(!groupAuth.authorized) return res.status(401).json({ error: groupAuth.cause});
      }
      else 
      {
        return res.status(401).json({ message: "Unauthorized" });
      }


      let membersNotFound = [];
      let NotInGroup = [] ; 
        //find the group with the same name that is unique

        
        //check if all the users are inside the users list
        let group = groupFind;
        let count= 0; 
        for(let i = 0 ; i< members.length ; i++)
        { 
          let user = await User.findOne({ "email" : members[i].email});
          if(!user)
            {
              count++; 
              membersNotFound.push(members[i]); 
            }//if the email doesn't exist
          else
            {
              let flag = 0; 
              for(let m of group.members) 
              {
                if(m.email == members[i].email)
                  {
                    group.members = group.members.filter( (e) => e.email!=m.email);
                    flag=1;
                  }
              }
              if(!flag)
              {
                count++ ; 
                NotInGroup.push(members[i]); 
              }
            }
          
        }
        if(count==members.length)return res.status(401).json({ message: "all the `memberEmails` either do not exist or are not in the group" })
        let done = await Group.replaceOne({ "name" : name}, {
          "name" : name,
          "members" :   group.members
            });  //replace the older group with the new one
        res.status(200).json({data : {
          "group" : group ,
          "NotInGroup" : NotInGroup, 
          "MembersNotFound" : membersNotFound 
        }
      , message : res.locals.message})

    } catch (err) {
        res.status(500).json({error : err.message})
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
      const adminAuth = verifyAuth(req, res, {authType: "Admin"}); 
      if (!adminAuth.authorized) return res.status(401).json({ error: adminAuth.cause});

    } catch (err) {
        res.status(500).json({error : err.message})
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
      const adminAuth = verifyAuth(req, res, {authType: "Admin"}); 
      if (!adminAuth.authorized) return res.status(401).json({ error: adminAuth.cause});
      
      const  name  = req.body.name;
      //find the group with the same name that is unique
      const groupFind = await Group.findOne({ name : name });
      //console.log(name);  //DEBUG
      if (!groupFind) return res.status(401).json({ message: "Group not found" })
      Group.deleteOne({name : name}).then(gr => res.status(200).json({data : "Success", message : res.locals.message}))
      .catch(err => { throw err }) 
    } catch (err) {
        res.status(500).json({error : err.message})
    }
}