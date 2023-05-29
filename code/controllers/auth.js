import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { verifyAuth } from './utils.js';
import { error } from 'console';

/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const register = async (req, res) => {
    try {
        let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        const { username, email, password } = req.body;
        if (!username || !email || !password || username == "" || email == "" || password == "" || !emailformat.test(email))
            return res.status(400).json({ error: "Not valid request" });
        const emailAlreadyUsed = await User.findOne({ email: email });
        if (emailAlreadyUsed)
            return res.status(400).json({ error: "The mail is already used" });
        const usernameAlreadyUsed = await User.findOne({ username: username });
        if (usernameAlreadyUsed)
            return res.status(400).json({ error: "The username is already used" });
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });
        res.status(200).json({
            data: { message: 'user added succesfully' },
            message: res.locals.message
        });
    } catch (error) {
        res.status(500).json({error : error.message});
    }
};

/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const registerAdmin = async (req, res) => {
    try {
        let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        const { username, email, password } = req.body;
        if (!username || !email || !password || username == "" || email == "" || password == "" || !emailformat.test(email))
            return res.status(400).json({ error: "Not valid request" });
        const emailAlreadyUsed = await User.findOne({ email: email });
        if (emailAlreadyUsed)
            return res.status(400).json({ error: "The mail is already used" });
        const usernameAlreadyUsed = await User.findOne({ username: username });
        if (usernameAlreadyUsed)
            return res.status(400).json({ error: "The username is already used" });
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "Admin"
        });
        res.status(200).json({ data: { message: 'user added succesfully' } });
    } catch (error) {
        res.status(500).json({error : error.message});
    }

}

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - error 400 is returned if the supplied password does not match with the one in the database
 */
export const login = async (req, res) => {
    try {
        let emailformat = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        const { email, password } = req.body;
        if (!email || !password || email == "" || password == "" || !emailformat.test(email))
            return res.status(400).json({ error: "Not valid request" });
        const existingUser = await User.findOne({ email: email })
        if (!existingUser)
            return res.status(400).json({error : 'please you need to register'})
        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) return res.status(400).json({error :'wrong credentials'})
        //CREATE ACCESSTOKEN
        const accessToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '1h' })
        //CREATE REFRESH TOKEN
        const refreshToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '7d' })
        //SAVE REFRESH TOKEN TO DB
        existingUser.refreshToken = refreshToken
        
        const savedUser = await existingUser.save();
        res.cookie("accessToken", accessToken, { httpOnly: true, domain: "localhost", path: "/api", maxAge: 60 * 60 * 1000, sameSite: "none", secure: true })
        res.cookie('refreshToken', refreshToken, { httpOnly: true, domain: "localhost", path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'none', secure: true })
        res.status(200).json({ data: { accessToken: accessToken, refreshToken: refreshToken } })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({error : error.message})
    }
}

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    - error 400 is returned if the user does not exist
 */
export const logout = async (req, res) => {
    let simpleAuth = verifyAuth(req, res, { authType: "Simple" })
    if (!simpleAuth.flag) return res.status(400).json({error : "Unauthorized"})
    const user = await User.findOne({ refreshToken: req.refreshToken })
    if (!user) return res.status(400).json({error : 'user not found'})
    try {
        user.refreshToken = null
        res.cookie("accessToken", "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
        res.cookie('refreshToken', "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
        const savedUser = await user.save()
        res.status(200).json({data: {message :'logged out'}})
    } catch (error) {
        res.status(500).json({error : error.message})
    }
}
