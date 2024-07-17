const User = require('../models/userModel');

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
        const currentPage = parseInt(req.query.page) || 1;
        const userPerPage = 10;
        const skip = (currentPage - 1) * userPerPage;

        const users = await User.find().skip(skip).limit(userPerPage);

        const totalProduct = await User.countDocuments();
        const totalPages = Math.ceil(totalProduct / userPerPage);

        res.render('userManagement', { users, currentPage, totalPages });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const blockAndUnblockUser = async (req, res, next) => {
    try {
        const userId = req.query.id;
        const userData = await User.findById(userId);
        
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        userData.is_block = !userData.is_block;
        await userData.save();

        let message = userData.is_block ? "User Blocked successfully" : "User Unblocked successfully";
        res.status(200).json({ message });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

module.exports = {
    loginLoad,
    verifyLogin,
    loadHome,
    loadUserManagement,
    blockAndUnblockUser
};
