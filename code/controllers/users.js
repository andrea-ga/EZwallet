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

    const adminAuth = verifyAuth(req, res, { authType: "Admin" })
    if (!adminAuth.authorized)
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
    if (!username || username == "") {
      res.status(404).json({ error: "Not found" })
    }
    const userAuth = verifyAuth(req, res, { authType: "User", username: username })
    if (userAuth.authorized) //the admin call this method
    {

    }
    else {
      const adminAuth = verifyAuth(req, res, { authType: "Admin" })
      if (!adminAuth.authorized)
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

    let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

    const simpleAuth = verifyAuth(req, res, { authType: "Simple" })
    if (!simpleAuth.authorized)
      return res.status(401).json({ error: simpleAuth.cause });


    const { name, memberEmails } = req.body;
    if (!name || !memberEmails || name == "")
      return res.status(400).json({ error: "Invalid request" })

    const groupFind = await Group.findOne({ name: name });
    let members = [];  //change the name to have the same name of the model
    //error 401 is returned if there is already an existing group with the same name
    if (groupFind)
      return res.status(400).json({ error: "Group with the same name already exist" })

    let us = await User.findOne({ refreshToken: req.cookies.refreshToken });
    let userAlreadyInGroup = await Group.findOne({ 'members.email': us.email })
    if (userAlreadyInGroup)
      return res.status(400).json({ error: "User creator already present in a group" });
      for (let i = 0; i < memberEmails.length; i++) {
      if (!emailformat.test(memberEmails[i]) || memberEmails[i] == "")
        return res.status(400).json({ error: "emails not in a valid format" });
    }

    if (!memberEmails.includes(us.email))
      memberEmails.push(us.email)

    let emailnot_founded = [];
    let emailAlready_inGroup = [];
    let counter = 0;

    for (let i = 0; i < memberEmails.length; i++) {
      let user = await User.findOne({ email: memberEmails[i] });
      if (!user)  //if the user is not present in the list of users
      {
        counter += 1;
        emailnot_founded.push(memberEmails[i]);
      }
      else if (user) {
        let find = await Group.findOne(
          {
            members: { $elemMatch: { "email": user.email } }
          }
        );

        if (find) {
          counter += 1;
          emailAlready_inGroup.push(memberEmails[i]);
        }
        else {
          members.push(user.email);
        }
      }
    }
    //-1 because there is always the creator mail
    if (counter === ((memberEmails.length)-1)) return res.status(400).json({ error: "the `memberEmails` either do not exist or are already in a group" })
    else {

      const group = new Group({ name, members });
      group.save()
        .then(() => res.json({
          data: {
            group,
            "membersNotFound": emailnot_founded,
            "alreadyInGroup": emailAlready_inGroup
          },
          refreshedTokenMessage: res.locals.refreshedTokenMessage
        }))
        .catch(err => { throw err })
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
    if (!adminAuth.authorized) return res.status(401).json({ error: adminAuth.cause });

    const group = await Group.find();
    let groups = group.map(e => ({ "name": e.name, "members": e.members }));
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
    if (req.params.name == "")
      return res.status(404).json({ error: "Not foun" })
    const group = await Group.findOne({ name: req.params.name });
    let simpleAuth = verifyAuth(req, res, { authType: "Simple" }); //if the cookies are valid
    if (!simpleAuth.authorized) return res.status(401).json({ error: simpleAuth.cause });
    let adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (adminAuth.authorized) {
      if (!group) res.status(400).json({ error: "Group not found" });
    }
    else {
      if (!group) res.status(400).json({ error: "Group not found" });
      const groupAuth = verifyAuth(req, res, { authType: "Group", emails: group.members });
      if (!groupAuth.authorized) return res.status(401).json({ error: groupAuth.cause });
    }
    res.status(200).json({ data: group, refreshedTokenMessage: res.locals.refreshedTokenMessage });
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

    let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

    const reAd = new RegExp("^.+/api/groups/[^/]+/insert$");

    const reUs = new RegExp("^.+/api/groups/[^/]+/add$");
    let groupfind;

    const adminAuth = verifyAuth(req, res, { authType: "Admin" });

    if (adminAuth.authorized && reAd.test(req.url)) // regexp for the URL 
    {
      groupfind = await Group.findOne({ name: req.params.name });
      if (!groupfind) res.status(400).json({ error: "Group not found" });
    }
    else if (reUs.test(req.url)) //regexp for the URL
    {
      groupfind = await Group.findOne({ name: req.params.name });
      if (!groupfind) res.status(400).json({ error: "Group not found" });
      let groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupfind.members })
      if (!group.authorized) return res.status(401).json({ error: groupAuth.cause });
    }
    else // useless
    {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.body.emails || !req.params.name || req.params.name == "")
      return res.status(400).json({ error: "Bad request" });
    //--> to be inserted?   || req.body.emails.length==0

    const membersNotFound = [];
    const alreadyInGroup = [];
    const newMembers = [];

    for (const m of req.body.emails) {
      if (m == "" || !emailformat.test(m))
        return res.status(400).json({ error: "Bad request" });
      const found = await User.findOne({ email: m });
      const already = await Group.findOne({ members: { $elemMatch: { email: m } } });

      if (!found)
        membersNotFound.push(m);
      else if (already)
        alreadyInGroup.push(m);
      else
        newMembers.push(found);
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

    if (!group)
      return res.status(401).json({ message: "Group not found" });

    const finalGroup = {
      group: group,
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
    const reAd = new RegExp("*/api/groups/*/pull");
    const reUs = new RegExp("*/api/groups/*/remove");
    let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
    const cookie = req.cookies

    const name = req.params.name;
    const members = req.body.emails;

    if (!name || name == "" || !members)
      return res.status(400).json({ error: "Bad request" });


    let group = await Group.findOne({ name: req.params.name });
    let adminAuth = verifyAuth(req, res, { authType: "Admin" });

    if (adminAuth.authorized && reAd.test(req.url)) // regexp for the URL 
    {
      if (!group) return res.status(400).json({ error: "Group not found" });
    }
    else if (reUs.test(req.url)) //regexp for the URL
    {
      if (!group) return res.status(401).json({ error: "Group not found" })
      let groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupFind.members });
      if (!groupAuth.authorized) return res.status(401).json({ error: groupAuth.cause });
    }
    else {
      return res.status(401).json({ error: "Unauthorized" });
    }


    let membersNotFound = [];
    let NotInGroup = [];

    if (group.members.emal.length == 1)
      return res.status(400).json({ error: "The group contain only one user" })
    let count = 0;
    for (let i = 0; i < members.length; i++) {

      if (members[i] == "" || !emailformat.test(members[i]))
        return res.status(400).json({ error: "Bad request" });
      let user = await User.findOne({ "email": members[i] });
      if (!user) {
        count++;
        membersNotFound.push(members[i]);
      }//if the email doesn't exist
      else {
        let flag = 0;
        for (let m of group.members) {
          if (m.email == members[i]) {
            group.members = group.members.filter((e) => e.email != m.email);
            flag = 1;
          }
        }
        if (!flag) {
          count++;
          NotInGroup.push(members[i]);
        }
      }

    }
    if (count == members.length) return res.status(400).json({ message: "all the `memberEmails` either do not exist or are not in the group" })
    let done = await Group.replaceOne({ "name": name }, {
      "name": name,
      "members": group.members
    });  //replace the older group with the new one
    res.status(200).json({
      data: {
        "group": group,
        "NotInGroup": NotInGroup,
        "MembersNotFound": membersNotFound
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
    let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.authorized)
      return res.status(401).json({ error: adminAuth.cause });



    //let countDeletionFromGroups = 0; //useless
    let removedFromGroup = false;
    let groupsIdArr = [];

    let email = req.body.email;

    if (email == "" || !emailformat.test(email))
      return res.status(400).json({ error: "Bad request" });

    const userFound = await User.findOne({ "email": email });

    // check if user exists
    if (!userFound) {
      return res.status(400).json({ error: "User not found" });
    }

    // delete transactions if exists any
    const deletedTransactions = await transactions.remove({ username: userFound.username });

    // find the groups and push all the ids in the arr
    const t = Group.find(
      {
        "members.email": email
      }).then((result) => {
        result.map((element) => {
          groupsIdArr.push(element._id.toString());
          removedFromGroup = true;
        })
      });

    if (groupsIdArr.length > 0)
      removedFromGroup = true;
    // update the Group list of memebers so remove the member 
    const test = await Group.updateMany(
      { members: { email: email } },
      { $pull: { members: { email: email } } },
    );

    // delete user from DB after all checks and the delete before
    await User.deleteOne({ email: email });



    // delete the group if in the previously ones found groups there are no members
    for (let v in groupsIdArr) {
      let x = await Group.findOneAndDelete(
        {
          $and: [
            { _id: groupsIdArr[v] },
            { $where: "this.members.length == 0" }]
        }
      );

    }


    res.status(200).json({ data: { deletedTransactions: deletedTransactions.deletedCount, removedFromGroup: removedFromGroup }, refreshToken: res.locals.refreshedTokenMessage });

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
    if (!adminAuth.authorized) return res.status(401).json({ error: adminAuth.cause });
    const name = req.body.name;
    if (!name || name == "")
      return res.status(400).json({ error: "Bad request" })
    //find the group with the same name that is unique
    const groupFind = await Group.findOne({ name: name });
    //console.log(name);  //DEBUG
    if (!groupFind) return res.status(400).json({ error: "Group not found" })
    Group.deleteOne({ name: name }).then(gr => res.status(200).json({ data: "Group deleted successfully", refreshToken: res.locals.refreshedTokenMessage }))
      .catch(err => { throw err })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


