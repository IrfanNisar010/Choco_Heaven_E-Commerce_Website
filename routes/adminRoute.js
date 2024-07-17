const express = require('express');
const session = require('express-session');
const admin_Route = express();

// Importing Controllers
const adminController = require('../controllers/adminController');
const brandsController = require('../controllers/brandsController');
const uploads = require('../middlewares/multer');

// Importing auth
const adminAuth = require('../middlewares/adminAuth');

admin_Route.set('views', './views/admin');

// Admin routes
admin_Route.get('/', adminAuth.isLogout, adminController.loginLoad);
admin_Route.post('/verifyLogin', adminController.verifyLogin);
admin_Route.get('/dashboard', adminAuth.isLogin, adminController.loadHome);
admin_Route.get('/userManage', adminAuth.isLogin, adminController.loadUserManagement);
admin_Route.get('/blockAndUnblockUser', adminAuth.isLogin, adminController.blockAndUnblockUser);

// Brand Management Routes
admin_Route.get('/brandsManage', adminAuth.isLogin, brandsController.BrandsPageLoad);
admin_Route.get('/addBrands', adminAuth.isLogin, brandsController.addBrandPageLoad);
admin_Route.post('/addBrands', adminAuth.isLogin,uploads.upload.single('brandsImage'), brandsController.addBrands);
admin_Route.get('/searchBrands', adminAuth.isLogin, brandsController.searchBrands);
admin_Route.get('/softDeleteBrands', adminAuth.isLogin, brandsController.softDeleteBrands);
admin_Route.get('/editBrands', adminAuth.isLogin, brandsController.editBrandsLoad);
admin_Route.post('/editBrands', adminAuth.isLogin, uploads.upload.single('brandsImage'), brandsController.editBrands);
admin_Route.get('/restoreBrands', adminAuth.isLogin, brandsController.restoreBrands);

module.exports = admin_Route;
