import { copyFileSync } from 'fs';
import jwt from 'jsonwebtoken'
/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
    const query = req.query;

    const date_regExp = new RegExp("[0-9]{4}\-[0-9]{2}\-[0-9]{2}");
    const d = {};

    if(query["from"]) {
        if(!date_regExp.test(query["from"]))
            throw new Error("wrong date format");

        d.$gte = new Date(query["from"] + "T00:00:00.000Z");
    }

    if(query["upTo"]) {
        if(!date_regExp.test(query["upTo"]))
            throw new Error("wrong date format");

        d.$lte = new Date(query["upTo"] + "T23:59:59.000Z");
    }

    if(query["date"]) {
        if(query["from"] || query["upTo"])
            throw new Error("wrong query format");

        if(!date_regExp.test(query["date"]))
            throw new Error("wrong date format");

        d.$gte = new Date(query["date"] + "T00:00:00.000Z");
        d.$lte = new Date(query["date"] + "T23:59:59.000Z");
    }

    return {date: d};
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies;
    if (!cookie.accessToken || !cookie.refreshToken) {
        return { flag: false, cause: "Unauthorized" };
    }
    try {
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return { flag: false, cause: "Token is missing information" }
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return { flag: false, cause: "Token is missing information" }
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return { flag: false, cause: "Mismatched users" };
        }



        if (info.authType == "User") 
        {   
            const  username = info.username;
            if( decodedAccessToken.username != username || decodedRefreshToken.username !=username)
            {                
                return { flag: false, cause: "Unauthorized" };
            }
            else if( decodedAccessToken.username == username && decodedRefreshToken.username == username)
            {
                return { flag: true, cause: "authorized" };
            }
        }
        else if (info.authType == "Admin")
        {   
            if( decodedAccessToken.role != "Admin" || decodedRefreshToken.role != "Admin")
            {
                return { flag: false, cause: "Unauthorized" };
            }
            else if( decodedAccessToken.role == "Admin" && decodedRefreshToken.role == "Admin")
            {
                return { flag: true, cause: "authorized" };
            }   
        }
        else if (info.authType == "Group")  
        {   
            let ATfind = info.emails.filter( e => e == decodedAccessToken.email ).length;
            let RTfind = info.emails.filter( e => e == decodedRefreshToken.email ).length;
        
            if( !ATfind || !RTfind  ) 
            {
                return { flag: false, cause: "Unauthorized" }; 
            }
            else if( ATfind  && RTfind )
            {
                return { flag: true, cause: "authorized" };
            }
        }
             
        
        return { flag: true, cause: "authorized" }
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.refreshedTokenMessage= 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                
                  if (!refreshToken.username || !refreshToken.email || !refreshToken.role) {
                        return { flag: false, cause: "Token is missing information" }
                }

                if (info.authType == "User")     //case of access token expired
                {   
                        const username = info.username;
                        if( refreshToken.username != username)
                        { 
                            return { flag: false, cause: "Unauthorized" };      
                        }
                        else if(refreshToken.username == username)
                        {
                        return { flag: true, cause: "authorized" };
                        }
                }
            else if (info.authType == "Admin")
                { 
                        if( refreshToken.role != "Admin")
                                { 
                                    return { flag: false, cause: "Unauthorized" };
                                }
                        else if(refreshToken.role == "Admin")
                                {
                                   return { flag: true, cause: "authorized" };
                                }
                }
            else if (info.authType == "Group")  
                {   
                
                        let RTfind = info.emails.filter( e => e == refreshToken.email );
                        if(  !RTfind )
                        { 
                            return { flag: false, cause: "Unauthorized" };
                        }
                        else if( RTfind)
                        {
                            return { flag: true, cause: "authorized" };
                        }
                }           
                return { flag: true, cause: "authorized" }
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return { flag: false, cause: "Perform login again" }
                } else {
                    return { flag: false, cause: err.name }
                }
            }
            
        } else {
            return { flag: false, cause: err.name };
        }
    }
}
/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
    const query = req.query;

    const a = {};

    if(query["min"]) {
        if(isNaN(query["min"]))
            throw new Error("the min amount value is not a number");

        a.$gte = parseFloat(query["min"]);
    }

    if(query["max"]) {
        if(isNaN(query["max"]))
            throw new Error("the max amount value is not a number");

        a.$lte = parseFloat(query["max"]);
    }

    return {amount: a};
}