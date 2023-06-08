# Test Report

## 

# Contents

- [Dependency graph](#dependency-graph)

- [Integration approach](#integration-approach)

- [Tests](#tests)

- [Coverage](#Coverage)


 


# Dependency graph 

![dependency_graph](./images/dependencyGraph.png)
     
# Integration approach

    bottom up approach
    step1: unit auth
    step2: unit controller
    step3: unit users
    step4: unit utils
    step5: unit auth + unit users
    step6: unit auth + unit users + unit controller
    step7: unit auth + unit users + unit controller + unit utils




# Tests

| Test case name | Object(s) tested | Test level | Technique used |
|--|--|--|--|
| **filters** |
| handleDateFilterParams | date parameters | unit, integration | statement coverage |
| handleAmountFilterParams| amount parameter | unit, integration | statement coverage |
| **authentication** |
| verifyAuth | authentication | unit, integration | statement coverage |
| registration | user | unit, integration | statement coverage |
| registerAdmin | admin | unit, integration | statement coverage |
| login | user | unit, integration | statement coverage |
| logout | user | unit, integration | statement coverage |
| **categories** |
| createCategory | category | unit, integration | statement coverage |
| updateCategory | category | unit, integration | statement coverage |
| getCategories | category | unit, integration | statement coverage |
| deleteCategory | category | unit, integration | statement coverage |
| **transactions** |
| createTransaction | transaction | unit, integration | statement coverage |
| getTransactionsByUser | transaction, user | unit, integration | statement coverage |
| getTransactionsByUserByCategory | transaction, user, category | unit, integration | statement coverage |
| getTransactionsByGroup | transaction, group  | unit, integration | statement coverage |
| getTransactionsByGroupByCategory | transaction, group, category | unit, integration | statement coverage |
| deleteTransaction | transaction, authentication | unit, integration | statement coverage |
| deleteTransactions | transaction, authentication | unit, integration | statement coverage |



# Coverage


## Coverage of FR

<Report in the following table the coverage of  functional requirements (from official requirements) >

### **FR Unit tests**
<!-- Nei test indicare ciascun Test (ciascun test case) -->
| Functional Requirements covered |   Unit Test(s) | 
| ------------------------------- | ----------- | 
| FR11 - register | correct registration |          
|| username already used | 
|| email already used |  
|| email in wrong format |
|| Raise exception |
| FR12  - login | correct login  |
|| wrong params (no pwd) | 
|| email  wrong format |
|| user not found |
|| raise exception |
| FR13 - logout | raise exception |
|| correct logout|
|| user not found |
|| Unauthorized |
| FR14 - registerAdmin | correct registration |
|| username already used |
|| email already used |
|| email in wrong format |
|| Raise exception ||

| Functional Requirements covered |   Unit Test(s)  | 
| ------------------------------- | ----------- | 
| FR15 - getUsers| should return empty list if there are no users |
|| should retrieve list of all users |
|| Unauthorized access |
|| raise exception |
| FR16 - getUser | admin login |
|| no credential |
|| user not found |
|| user search his profile |
|| raise exception |
| FR17 - deleteUser | no admin privileges |
|| user not found | 
|| User successfully deleted and in a group |
| FR21 - createGroup | Normal behavior |
|| Group with the same name already exist | 
|| No cookies |
|| Email format not valid |
|| invalid request |
| FR22 - getGroups | admin request |
|| no admin |
|| no groups |
|| raise exception |
| FR23 - getGroup | no cookies |
|| user not in the group list  |
|| admin doesn't find a group |
|| user not find a group |
|| raise exception |
| FR24 - addToGroup | Group not found |  
|| admin request with wrong email format | 
|| user request not authorized |
|| user request group not found |
|| user request, all ok |
|| Bad request |
|| User access with admin path |
| FR26 - removeFromGroup | Admin request but group has only one user |
|| Admin request with valid group and members to remove |
|| Admin request but wrong email format |
|| Bad request |
|| user request not authorized |
|| user request with admin path |
|| user request group not found |
|| Admin request |
| FR28 - deleteGroup | not admin |
|| bad request |
|| group not found |
|| success |



| Functional Requirements covered |   Integration Test(s)  | 
| ------------------------------- | ----------- | 
| FR31 - createTransaction| should return the new transaction |
|| Unauthorized access |
|| raise exception |
|| empty username field |
|| empty type field |
|| amount field is not a number |
|| route param user not found |
|| req body user not found |
|| req body user and route param user dont match |
|| category not found |
| FR32 - getAllTransactions | should return empty list if there are no transactions |
|| should retrieve list of all transactions |
|| Unauthorized access |
|| raise exception |
| FR33 - getTransactionsByUser  | should return transactions for admin route |
||  should return transactions for user route with date and amount filters |
|| should return 400 error if user does not exist |
|| should return 401 error for unauthorized user |
| FR34 - getTransactionsByUserByCategory| admin route - should return empty list if there are no transactions for that user and category |
|| admin route - should return list of transactions for that user and category |
|| user route - should return empty list if there are no transactions for that user and category |
|| user route - should return list of transactions for that user and category |
|| admin route - should return 500 if there is an error |
|| user route - should return 500 if there is an error |
|| admin route - should return 401 if user is not authorized |
|| user route - should return 401 if user is not authorized |
|| admin route - should return 400 if user does not exist | 
|| user route - should return 400 if user does not exist |
|| admin route - should return 400 if category does not exist |
|| user route - should return 400 if category does not exist |
| FR35 - getTransactionsByGroup | admin route - should return empty list if there are no group transactions |
||  admin route - should retrieve list of all group transactions |
|| user route - should return empty list if there are no group transactions |
|| user route - should retrieve list of all group transactions| 
|| admin route - Unauthorized access |
|| user route - Unauthorized access |
|| admin route - Group not found | 
|| user route - Group not found |
|| admin route - raise exception |
|| user route - raise exception |
| FR36 - getTransactionsByGroupByCategory | admin route - should return the list of transactions for that group and category |
|| user route - should return the list of transactions for that group and category |
|| admin route - should return empty list if there are no group transactions for that category |
|| user route - should return empty list if there are no group transactions for that category |
|| admin route - Unauthorized access |
|| user route - Unauthorized access |
|| admin route - Group not found |
|| user route - Group not found |
|| admin route - Category not found |
|| user route - Category not found |
|| admin route - raise exception |
|| user route - raise exception |
||  |
| FR37 - deleteTransaction | User request to delete an existing transaction |
|| User request to delete a non-existing transaction |
|| User request to delete a transaction of a different user |
|| User request with missing _id |
|| Authenticated user request to delete a transaction of another user|
| FR38 - deleteTransactions | Admin request to delete existing transactions |
|| Admin request to delete non-existing transactions |
|| Non-admin request to delete transactions |
|| Invalid request with missing _ids |
|| Invalid request with empty _id |
|| Internal server error |
| FR41 - createCategory | should return the new category |
|| raise exception |
|| Unauthorized access |
|| empty type field |
|| empty color field|
|| type already present |
| FR42 - updateCategory | Update category |
|| Admin request to update existing category with transactions |
|| Admin request to update existing category without transactions |
|| Admin request to update non-existing category |
|| Admin request to update category with missing request body attributes |
|| Non-admin request to update category |
| FR43 - deleteCategory | Admin request to delete existing categories with transactions |
|| Admin request to delete non-existing categories |
|| Admin request to delete more categories than present in the database |
|| Admin request to delete the only category in the database |
|| Non-admin request to delete categories |
|| Invalid request with missing types |
|| Invalid request with empty type |
| FR44 - getCategories | should return empty list if there are no categories |
|| should retrieve list of all categories |
|| Unauthorized access |
|| raise exception |


### **FR Integration tests**


<!-- Nei test indicare ciascun Test (ciascun test case) -->
| Functional Requirements covered |   Integration Test(s) | 
| ------------------------------- | ----------- | 
| FR11 - register | Correct registration |          
|| Wrong registration, mail not valid | 
|| Wrong registration, mail already used |  
|| Wrong registration, username already used  |
| FR12  - login | Correct login regular user  |
|| No pwd | 
|| No mail |
|| Not registered yet |
|| Wrong pwd |
|| Email wrong format |
| FR13 - logout | Correct logout after login |
|| Unauthorized logout |
| FR14 - registerAdmin | Correct registration |
|| Wrong registration, mail not valid |
|| Wrong registration, mail already used |
|| Wrong registration, username already used |



| Functional Requirements covered |   Integration Test(s)  | 
| ------------------------------- | ----------- | 
| FR15 - getUsers| should return Unauthorized |
|| should return a list of all users |
| FR16 - getUser | User try to take info of another user |
|| User takes his info |
|| Admin takes info of a user |
| FR17 - deleteUser | request boby email is not present |
|| User try to delete another user | 
|| User successfully deleted and in a group |
|| Admin delete another user |
|| Admin try to delete another admin |
|| Admin delete another user that the only member of a group |
| FR21 - createGroup | User creates a group |
|| User creates a group with mails has a wrong format | 
|| User create a group with all members not found |
|| User create a group with only the creator present |
|| User create a group with a wrong name|
|| User create a group with a name already taken |
|| Cookie not present |
|| Group creator already in a group |
|| User creates a group with all members already in a group |
| FR22 - getGroups | Admin get all groups |
|| No admin cookie |
| FR23 - getGroup | Admin get group |
|| No admin cookie |
|| No group found |
|| Group found and user present in members |
|| Group found and user not present in members |
| FR24 - addToGroup | Admin add user to group |  
|| Admin add user to group with some users already in the group | 
|| User try to add an user to a group where he is not enrolled |
|| User try to add an user to a group where he is enrolled |
|| wrong request format, no field emails |
|| No cookie |
|| Group not found |
| FR26 - removeFromGroup | Admin remove user from group of one memeber |
|| Admin remove user from group |
|| Admin request but wrong email format |
|| User try to remove user from group without being authorized |
|| User try to remove user from group where he is enrolled |
|| Bad request |
|| Admin try to remove user that not exist from group|
| FR28 - deleteGroup | Admin delete group |
|| No admin cookie |
|| No group found  |
|| req error  |





| Functional Requirements covered |   Integration Test(s)  | 
| ------------------------------- | ----------- | 
| FR31 - createTransaction| should return the new transaction |
|| Unauthorized access |
|| empty username field |
|| empty type field |
|| amount field is not a number |
|| route param user not found |
|| req body user not found |
|| req body user and route param user don't match |
|| category not found |
| FR32 - getAllTransactions | should return empty list if there are no transactions |
|| should retrieve list of all transactions |
|| Unauthorized access |
| FR33 - getTransactionsByUser | User search for another user transactions |
|| User search for his transactions |
|| User search for his transactions with date filter |
|| User search for his transactions with amount filter |
|| User search for his transactions with amount and date filter |
|| Admin search for another user transactions |
|| No cookie |
|| User search for his transactions with amount and date filter second test |
| FR34 - getTransactionsByUserByCategory | admin route - should return empty list if there are no transactions for that user and category |
|| admin route - should return list of transactions for that user and category |
|| user route - should return empty list if there are no transactions for that user and category |
|| user route - should return list of transactions for that user and category |
|| admin route - should return 401 if user is not authorized |
|| user route - should return 401 if user is not authorized |
|| admin route - should return 400 if user does not exist|
|| user route - should return 400 if user does not exist |
|| admin route - should return 400 if category does not exist | 
|| user route - should return 400 if category does not exist|
| FR35 - getTransactionByUserByCategory | admin route - should return empty list if there are no group transactions |
|| admin route - should retrieve list of all group transactions |
|| admin route - Unauthorized access |
|| user route - Unauthorized access |
|| admin route - Group not found |
|| user route - Group not found |
| FR36 - getTransactionsByGroupByCategory | admin route - should return the list of transactions for that group and category |
|| user route - should return the list of transactions for that group and category |
|| admin route - should return empty list if there are no group transactions for that category |
|| user route - should return empty list if there are no group transactions for that category |
|| admin route - Unauthorized access |
|| user route - Unauthorized access |
|| admin route - Group not found |
|| user route - Group not found |
|| admin route - Category not found |
|| user route - Category not found |
| FR37 - deleteTransaction | Invalid user |
|| req body not present |
|| transaction not found |
|| User try to delete a transaction created by another user |
|| User try to delete a transaction created by himself |
| FR38 - deleteTransactions | Not authorized |
|| Empty _ids |
|| Invalid single id |
|| Id not found |
|| Transaction correctly deleted |
|| Transaction correctly deleted with Access token expired |
| FR41 - createCategory | should return the new category |
|| Unauthorized access |
|| empty type field |
|| empty color field|
|| type already present |
| FR42 - updateCategory | User unauthorized |
|| Category not found |
|| Category already present |
|| Update category |
| FR43 - deleteCategory | User unauthorized |
|| Request body wrong |
|| Types is empty |
|| Types include an empty string |
|| We have 5 category and try to delete 6 category |
|| Try to delete all categories |
|| Try to delete 2 categories |
| FR44 - getCategories | should return empty list if there are no categories |
|| should retrieve list of all categories |
|| Unauthorized access |



## Coverage white box
### Test coverage
Report here the screenshot of coverage values obtained with jest-- coverage 

![coverage_report](./img/testCoverage.png)

# White Box Unit Tests

### Unit Test cases definition
    
| Unit name | Jest test case |
|--|--|
|auth.js|auth.unit.test.js|
|controller.js|controller.unit.test.js|
|utils.js|utils.unit.test.js|
|users.js|users.unit.test.js|


### Integration Test cases definition
    
| Unit name | Jest test case |
|--|--|
|auth.js|auth.integration.test.js|
|controller.js|controller.integration.test.js|
|utils.js|utils.integration.test.js|
|users.js|users.integration.test.js|



### Code coverage report




<!--
### Loop coverage analysis
-->


