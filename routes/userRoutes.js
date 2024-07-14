const express = require('express');
const user_route = express.Router();

// middleware for session handling
const userAuth = require('../middlewares/userAuth');
// const errorMiddleware = require('./middlewares/errorMiddleware');

// google 
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(CLIENT_ID);

// for google auth
const passport = require('passport')
const passportAuth = require('../middlewares/passportAuth')

user_route.use(passport.initialize())
user_route.use(passport.session())

const userController = require("../controllers/userController");

user_route.get('/', userController.loadHome)

user_route.get('/login', userAuth.isLogout, userController.loginLoad);

user_route.get('/signUp', userAuth.isLogout, userController.loadSignUp);

user_route.post('/signUp', userController.addUser);

user_route.get('/verifyOtp', userController.otpLoad);

user_route.get('/resendOTP', userAuth.isLogout, userController.ResendOtp);

user_route.post('/otpVerify', userController.verifyOtp);

user_route.get('/home', userController.loadHome);

user_route.get('/loadShop', userController.loadShop);

user_route.get('/product-1', userController.loadProduct);

user_route.post('/verifyLogin', userController.verifyLogin);

user_route.get('/passportAuth/googleAuth',passport.authenticate('google',{scope:['profile','email']}));
user_route.get('/passportAuth/googleAuth/callback',passport.authenticate('google',{failureRedirect:'/login'}),userController.googleAuth)

user_route.get('/logout' , userAuth.loginCheck, userController.userLogout);

module.exports = user_route;
