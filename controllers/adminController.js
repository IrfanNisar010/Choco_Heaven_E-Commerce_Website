const User = require('../models/userModel');
// const Products = require('../models/productModel');
// const Category = require('../model/categoryModel');

const loginLoad = async (req, res) => {
    try {
        res.render('adminLogin'); 
    } catch (error) {
        console.log(error.message);
    }
};

const verifyLogin = async (req, res) => {
    try {
        const isUser = req.body;
        const email = process.env.AUTH_ADMIN_EMAIL;
        const password = process.env.AUTH_ADMIN_PASSWORD;

        if (isUser.email === email) {
            if (isUser.password === password) {
                req.session.admin = { email: isUser.email };
                res.redirect('/admin/dashboard');
            } else {
                return res.render('adminLogin', { message: "Please enter a valid User Name and Password" });
            }
        } else {
            return res.render('adminLogin', { message: "Please enter a valid User Name and Password" });
        }

    } catch (error) {
        console.log(error.message);
    }
};

const loadHome = async (req, res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
};

const loadUserManagement = async (req, res, next) => {
    try {
        res.render('userManagement')

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}
const blockAndUnblockUser = async (req, res, next) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id })
        userData.is_block = !userData.is_block
        await userData.save()

        if (userData.is_block) {
            delete req.session.userId;
        }

        let message = userData.is_block ? "User Blocked successfully" : "User Unblocked successfully";

        res.status(200).json({ message })

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


module.exports = {
    loginLoad,
    verifyLogin,
    loadHome,
    loadUserManagement,
    blockAndUnblockUser
};
