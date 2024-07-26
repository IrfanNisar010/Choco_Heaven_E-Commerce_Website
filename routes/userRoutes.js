const express = require('express');
const user_route = express.Router();

// middleware for session handling
const userAuth = require('../middlewares/userAuth');
// const errorMiddleware = require('./middlewares/errorMiddleware');

// google 
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(CLIENT_ID);

const uploads = require('../middlewares/multer');


// for google auth
const passport = require('passport')
const passportAuth = require('../middlewares/passportAuth')

user_route.use(passport.initialize())
user_route.use(passport.session())

const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");

// load Home
user_route.get('/', userController.loadHome)

user_route.get('/login', userAuth.isLogout, userController.loginLoad);
user_route.get('/signUp', userAuth.isLogout, userController.loadSignUp);
user_route.post('/signUp', userController.addUser);
user_route.get('/verifyOtp', userController.otpLoad);
user_route.get('/resendOTP', userAuth.isLogout, userController.ResendOtp);
user_route.post('/otpVerify', userController.verifyOtp);
user_route.get('/home', userController.loadHome);
user_route.get('/loadShop', userController.loadShop);
user_route.get('/singleProduct', userController.loadProduct);
user_route.post('/verifyLogin', userController.verifyLogin);

// Google Authentication
user_route.get('/passportAuth/googleAuth',passport.authenticate('google',{scope:['profile','email']}));
user_route.get('/passportAuth/googleAuth/callback',passport.authenticate('google',{failureRedirect:'/login'}),userController.googleAuth);


// User Profile Manage
user_route.get('/profileDetails', userAuth.isLogin, userController.userProfileLoad);
user_route.get('/profile/updateProfile', userAuth.isLogin, userController.updateProfileLoad);
user_route.post('/updateProfile', userAuth.isLogin, uploads.upload.single('image'), userController.updateProfile);

// forgot password and reset
user_route.get('/forgotPassword', userController.forgotPasswordPage);
user_route.post('/verifyEmail',userController.verifyEmail);
user_route.post('/forgotOtpVerify',userController.forgotOtpVerify);
user_route.post('/resetPassword',userController.resetPassword);

// Address Management
user_route.get('/addressManage', userAuth.isLogin, userController.addressManageLoad);
user_route.post('/addAddress',userAuth.isLogin,userController.saveAddress);
user_route.post('/editAddress',userAuth.isLogin,userController.editAddress);
user_route.get('/deleteAddress',userAuth.isLogin,userController.deleteAddress);
 
// Order Manage
user_route.get('/ordersManage', userAuth.isLogin, orderController.ordersPageLoad);

// User Cart  Manage
user_route.get('/cart', userAuth.isLogin, cartController.cartLoad);
user_route.get('/addToCart', cartController.addToCart);
user_route.get('/removeFromCart',userAuth.isLogin,cartController.removeFromCart)
user_route.post('/updateQuantity', userAuth.isLogin, cartController.updateQuantity)

// user Logout
user_route.get('/logout',userAuth.loginCheck,userController.userLogout);

module.exports = user_route;
