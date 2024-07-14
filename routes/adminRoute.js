const express = require('express');
const session = require('express-session')
const admin_Route = express();

// Importing Controllers
const adminController = require('../controllers/adminController');

// Importing auth
const adminAuth = require('../middlewares/adminAuth');

admin_Route.set('views', './views/admin');

module.exports = admin_Route;

// Admin routes
admin_Route.get('/', adminAuth.isLogout, adminController.loginLoad);

admin_Route.post('/verifyLogin', adminController.verifyLogin);

admin_Route.get('/dashboard', adminAuth.isLogin, adminController.loadHome);

admin_Route.get('/userManage', adminAuth.isLogin, adminController.loadUserManagement);

admin_Route.get('/blockAndUnblockUser', adminAuth.isLogin, adminController.blockAndUnblockUser)
