const express = require('express');
const session = require('express-session');
const admin_Route = express();

// Importing Controllers
const adminController = require('../controllers/adminController');
const brandsController = require('../controllers/brandsController');
const productController = require('../controllers/productController');

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
admin_Route.get('/searchUser', adminAuth.isLogin, adminController.searchUser);
admin_Route.get('/logout', adminController.logout);

// Brand Management Routes
admin_Route.get('/brandsManage', adminAuth.isLogin, brandsController.BrandsPageLoad);
admin_Route.get('/addBrands', adminAuth.isLogin, brandsController.addBrandPageLoad);
admin_Route.post('/addBrands', adminAuth.isLogin,uploads.upload.single('brandsImage'), brandsController.addBrands);
admin_Route.get('/searchBrands', adminAuth.isLogin, brandsController.searchBrands);
admin_Route.get('/softDeleteBrands', adminAuth.isLogin, brandsController.softDeleteBrands);
admin_Route.get('/editBrands', adminAuth.isLogin, brandsController.editBrandsLoad);
admin_Route.post('/editBrands', adminAuth.isLogin, uploads.upload.single('brandsImage'), brandsController.editBrands);
admin_Route.get('/restoreBrands', adminAuth.isLogin, brandsController.restoreBrands);

// product Management Routes
admin_Route.get('/productManage', adminAuth.isLogin, productController.productsLoad)
admin_Route.get('/addProduct', adminAuth.isLogin, productController.addProductLoad)
admin_Route.post('/addProduct', adminAuth.isLogin, uploads.productUpload, productController.addProduct)
admin_Route.get('/searchProduct', adminAuth.isLogin, productController.searchProduct)
admin_Route.get('/listAndUnlistProduct', adminAuth.isLogin, productController.listAndUnlistProduct)
admin_Route.get('/editProduct', adminAuth.isLogin, productController.editProductLoad)
admin_Route.get('/removeProductImage', adminAuth.isLogin, productController.deleteImage)
admin_Route.post('/editProduct', adminAuth.isLogin, uploads.productUpload, productController.editProduct)

module.exports = admin_Route;
