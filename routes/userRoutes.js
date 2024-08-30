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
const couponController = require("../controllers/couponController")

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
user_route.get('/resetPasswordPageLoad', userController.resetPasswordPageLoad);
user_route.post('/verifyEmail',userController.verifyEmail);
user_route.post('/forgotOtpVerify',userController.forgotOtpVerify);
user_route.post('/resetPassword',userController.resetPassword);
user_route.post('/resetPasswordForUser',userController.resetPasswordForUser);

// Address Management
user_route.get('/addressManage', userAuth.isLogin, userController.addressManageLoad);
user_route.post('/addAddress',userAuth.isLogin,userController.saveAddress);
user_route.post('/editAddress',userAuth.isLogin,userController.editAddress);
user_route.get('/deleteAddress',userAuth.isLogin,userController.deleteAddress);
 
// Order, Checkout Manage
user_route.get('/ordersManage', userAuth.isLogin, orderController.ordersPageLoad);
user_route.get('/getOrderStatus', userAuth.isLogin, orderController.getOrderStatus);
user_route.get('/orderDetails', userAuth.isLogin, orderController.orderDetailsLoad);
user_route.get('/checkout', userAuth.isLogin, orderController.checkoutPageLoad);
user_route.post('/createOrder', userAuth.isLogin, orderController.createOrder);
user_route.get('/cancelOrder', userAuth.isLogin, orderController.cancelOrder);
user_route.post('/returnOrder',userAuth.isLogin,orderController.requestForReturn);
user_route.get('/downloadInvoice',userAuth.isLogin, orderController.downloadInvoice);
user_route.post('/verifyPayment', userAuth.isLogin, orderController.verifyPayment);
user_route.post('/getPaymentDetails', userAuth.isLogin, orderController.getPaymentDetails);
user_route.get('/wallet', userAuth.isLogin, orderController.walletLoad);


// User Cart  Manage
user_route.get('/cart', userAuth.isLogin, cartController.cartLoad);
user_route.get('/addToCart', cartController.addToCart);
user_route.get('/removeFromCart',userAuth.isLogin,cartController.removeFromCart);
user_route.post('/updateQuantity', userAuth.isLogin, cartController.updateQuantity);

//Wishlist Manage
user_route.get('/wishlist', userAuth.isLogin, cartController.wishlistLoad);
user_route.get('/addToWishlist', cartController.addToWishlist);
user_route.get('/removeFromWishlist', userAuth.isLogin, cartController.removeFromWishlist);

//Coupon Manage
user_route.get('/coupons',userAuth.isLogin,couponController.showCouponForUser)
user_route.post('/applyCoupon',userAuth.isLogin,couponController.applyCoupon)
user_route.get('/removeCoupon',userAuth.isLogin,couponController.removeCoupon)


// user Logout
user_route.get('/logout',userAuth.loginCheck,userController.userLogout);

module.exports = user_route;
