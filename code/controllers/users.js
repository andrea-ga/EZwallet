import { group } from "console";
import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import { timingSafeEqual } from "crypto";
import jwt from 'jsonwebtoken'
/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {

    const adminAuth = verifyAuth(req, res, { authType: "Admin" })
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });  //check the NUMBER

    let user = await User.find();
    let users = user.map(e => ({ "username": e.username, "email": e.email, "role": e.role }));
    return res.status(200).json({ data: users, refreshedTokenMessage: res.locals.refreshedTokenMessage });
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
    const username = req.params.username;
    const userAuth = verifyAuth(req, res, { authType: "User", username: username })
    if (userAuth.flag) //the admin call this method
    {

    }
    else {
      const adminAuth = verifyAuth(req, res, { authType: "Admin" })
      if (!adminAuth.flag)
        return res.status(401).json({ error: adminAuth.cause });
    }

    let currentUser = await User.findOne({ username: req.params.username });
    if (!currentUser)
      return res.status(400).json({ error: "User not found" }); //useless 

    let find = { "username": currentUser.username, "email": currentUser.email, "role": currentUser.role }
    res.status(200).json({ data: find, refreshedTokenMessage: res.locals.refreshedTokenMessage })
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

    let emailformat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ ;

    const simpleAuth = verifyAuth(req, res, { authType: "Simple" })
    if (!simpleAuth.flag)
      return res.status(401).json({ error: simpleAuth.cause });
    const { name, memberEmails } = req.body;
    if (!name || !memberEmails || name == "")
      return res.status(400).json({ error: "Invalid request" })

    const groupFind = await Group.findOne({ name: name });
    let members = [];  //change the name to have the same name of the model
    //error 401 is returned if there is already an existing group with the same name
    if (groupFind)
      return res.status(400).json({ error: "Group with the same name already exist" })
      const decodedRefreshToken = jwt.verify(req.cookies.refreshToken, process.env.ACCESS_KEY);
    let us = await User.findOne({ email: decodedRefreshToken.email});
    let userAlreadyInGroup = await Group.findOne({ 'members.email': decodedRefreshToken.email })   
    if (userAlreadyInGroup)
      return res.status(400).json({ error: "User creator already present in a group" });
      for (let i = 0; i < memberEmails.length; i++) {
      if (!emailformat.test(memberEmails[i]) || memberEmails[i] == "")
        return res.status(400).json({ error: "Invalid email format" });
    }
    let emailnot_founded = [];
    let emailAlready_inGroup = [];
    let counter = 0;
    for (let i = 0; i < memberEmails.length; i++) {
      let user = await User.findOne({ email: memberEmails[i] });
      if (!user)  //if the user is not present in the list of users
      {
        counter += 1;
        emailnot_founded.push({email :memberEmails[i]});
      }
      else if (user) {
        let find = await Group.findOne(
          {
            members: { $elemMatch: { "email": user.email } }
          }
        );

        if (find) {
          counter += 1;
          emailAlready_inGroup.push({email :memberEmails[i]});
        }
        else {
          members.push({email : user.email, user : user});
        }
      }
    }
    
    if (counter === (memberEmails.length)) return res.status(400).json({ error: "the `memberEmails` either do not exist or are already in a group" })
    else {
      if (!memberEmails.includes(us.email))
        members.push({email : us.email, user : us})
      const gr = new Group({ name, members });
      let group = await gr.save();
       return  res.status(200).json({
          data: {
            group : { 
              name : group.name,
              members : group.members.map(e => ({email : e.email}))
            },
            "membersNotFound": emailnot_founded,
            "alreadyInGroup": emailAlready_inGroup
          },
          refreshedTokenMessage: res.locals.refreshedTokenMessage
        })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
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

    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.flag) return res.status(401).json({ error: adminAuth.cause });

    const group = await Group.find();
    let groups = group.map(e => ({ "name": e.name, "members": e.members.map(c =>({ email : c.email})  ) }));
    res.status(200).json({ data: groups, refreshedTokenMessage: res.locals.refreshedTokenMessage });
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    const group = await Group.findOne({ name: req.params.name });
    let simpleAuth = verifyAuth(req, res, { authType: "Simple" }); //if the cookies are valid
    if (!simpleAuth.flag) return res.status(401).json({ error: simpleAuth.cause });
    let adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (adminAuth.flag) {
      if (!group) return res.status(400).json({ error: "Group not found" });
    }
    else {
      if (!group) res.status(400).json({ error: "Group not found" });
      const groupAuth = verifyAuth(req, res, { authType: "Group", emails: group.members });
      if (!groupAuth.flag) return res.status(401).json({ error: groupAuth.cause });
    }
    res.status(200).json({ data: {group : {name : group.name , members : group.members.map(e => ({email : e.email}))}}, refreshedTokenMessage: res.locals.refreshedTokenMessage });
  } catch (err) {
    res.status(500).json({ error: err.message })
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

    let emailformat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ ;

    const reAd = new RegExp("^.*/groups/[^/]+/insert$");

    const reUs = new RegExp("^.*/groups/[^/]+/add$");
    let groupfind;
    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    
    if (adminAuth.flag && reAd.test(req.url)) // regexp for the URL 
    {
      groupfind = await Group.findOne({ name: req.params.name });
      if (!groupfind)
        return res.status(400).json({ error: "Group not found" });
    }
    else if (reUs.test(req.url)) //regexp for the URL
    {
      groupfind = await Group.findOne({ name: req.params.name });
      if (!groupfind) 
        return res.status(400).json({ error: "Group not found" });
      let groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupfind.members })
      if (!groupAuth.flag) 
        return res.status(401).json({ error: groupAuth.cause });
    }
    else 
    {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!req.body.emails)
      return res.status(400).json({ error: "Bad request" });
    //--> to be inserted?   || req.body.emails.length==0
    const membersNotFound = [];
    const alreadyInGroup = [];
    const newMembers = [];
    for (let m of req.body.emails) {
      if (m == "" || !emailformat.test(m))
        return res.status(400).json({ error: "Bad request" });
      
      let found = await User.findOne({ email: m });
      let already = await Group.findOne({ members: { $elemMatch: { email: m } } });
      if (!found)
        membersNotFound.push({ email : m });
      else if (already)
        alreadyInGroup.push({ email : m });
      else
        newMembers.push({email : m });
    }
    if (newMembers.length === 0)
      return res.status(400).json({ error: "All emails wrong or already used" });

    const groupName = req.params.name;
    const group = await Group.findOneAndUpdate({ name: groupName },
      {
        $push: {
          members: newMembers
        }
      },
      { new: true }
    );
      
      const finalGroup = {
      group: {name : group.name
        ,
        members : group.members.map(e => ({email : e.email})) },
      alreadyInGroup: alreadyInGroup,
      membersNotFound: membersNotFound
    }

    res.status(200).json({ data: finalGroup, refreshToken: res.locals.refreshedTokenMessage });
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    const reAd = new RegExp("^.*groups/[^/]+/pull$");
    const reUs = new RegExp("^.*groups/[^/]+/remove$");
    let emailformat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ ;
    const cookie = req.cookies

    const name = req.params.name;
    
    let group = await Group.findOne({ name: req.params.name });
    let adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (adminAuth.flag && reAd.test(req.url)) // regexp for the URL 
    {
      
      if (!group)
         return res.status(400).json({ error: "Group not found" });
    }
    else if (reUs.test(req.url)) //regexp for the URL
    {
      if (!group) 
        return res.status(400).json({ error: "Group not found" })
      let groupAuth = verifyAuth(req, res, { authType: "Group", emails: group.members });
      if (!groupAuth.flag)
         return res.status(401).json({ error: groupAuth.cause });
    }
    else {     
       return res.status(401).json({ error: "Unauthorized" });
    }

    const members = req.body.emails;
    if (!members)  //  || memebers = []
      return res.status(400).json({ error: "Bad request" });
    let membersNotFound = [];
    let NotInGroup = [];

    if (group.members.length == 1)
      return res.status(400).json({ error: "Group contains only one member" })
    let count = 0;
    for (let i = 0; i < members.length; i++) {
      if (members[i] == "" || !emailformat.test(members[i]))
        return res.status(400).json({ error: "Bad request" });
      let user = await User.findOne({ "email": members[i] });

      if (!user) {//if the email doesn't exist
        count++;
        membersNotFound.push(members[i]);
      }
      else {
        let flag = 0;
        for (let m of group.members) {
          if (m.email == members[i]) {
            group.members = group.members.filter((e) => e.email != m.email);
            flag = 1;
            break;
            
          }
        }
        if (flag==0) {
          count++;
          NotInGroup.push(members[i]);
        }
      }

    }
    if (count == members.length) 
      return res.status(400).json({ error: "all the `memberEmails` either do not exist or are not in the group" })
    if(group.members.length==0)
    {
      let group2 = await Group.findOne({ name: req.params.name });
      group.members.push({email :group2.members[0].email});   
    }
    let done = await Group.replaceOne({ "name": req.params.name  }, {
      "name": name,
      "members": group.members
    });  //replace the older group with the new one 
    return res.status(200).json({
      data: {
        "group": {
          name : group.name,
          members : group.members.map((e) => ({email : e.email}))
        },
        "membersNotFound": membersNotFound,
        "notInGroup": NotInGroup
        
      }
      , refreshedTokenMessage: res.locals.refreshedTokenMessage
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
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
   let emailformat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ ;

    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.flag)
      return res.status(401).json({ error: adminAuth.cause });

    //let countDeletionFromGroups = 0; //useless
  let removed = false;
	let grouplist ;
	let email = req.body.email;

    if (email == "" || !emailformat.test(email))
      return res.status(400).json({ error: "Bad request" });

    const userFound = await User.findOne({ "email": email });

    // check if user exists
    if (!userFound) {
      return res.status(400).json({ error: "User not found" });
    }
    if(userFound.role == "Admin"){
      return res.status(400).json({ error: "Admin can't be removed" });
    }
	const deletedTransactions = await transactions.deleteMany({ username: userFound.username });
	let gf = await Group.findOne(
      {
        "members.email": email
      })
	  if(gf)
	  {
		removed=true
		grouplist = gf.members.filter((e) => e.email!= email)
		if(grouplist.length==0) 
		{
		await Group.deleteOne({ name : gf.name})
		}
		else 
		{
		await Group.updateOne({name : gf.name},{members : grouplist})
		}
	  }
    await User.deleteOne({email : email})
	  res.status(200).json({ data: { deletedTransactions: deletedTransactions.deletedCount, removedFromGroup: removed }, refreshToken: res.locals.refreshedTokenMessage });

  } catch (err) {
    res.status(500).json({ error: err.message })
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
    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.flag) return res.status(401).json({ error: adminAuth.cause });
    const name = req.body.name;
    if (!name || name == "")
      return res.status(400).json({ error: "Bad request" })
    //find the group with the same name that is unique
    const groupFind = await Group.findOne({ name: name });
    //console.log(name);  //DEBUG
    if (!groupFind) return res.status(400).json({ error: "Group not found" })
    Group.deleteOne({ name: name }).then(gr => res.status(200).json({ data: {message : "Group deleted successfully"}, refreshToken: res.locals.refreshedTokenMessage }))
      .catch(err => { throw err })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


