const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const OTP = require('../models/Otp')
const Address = require('../models/addressModel')
const crypto = require('crypto');
const Cart = require('../models/cartModel')
const Offer = require('../models/offerModel')
const mailgen = require('mailgen');
const Wishlist = require('../models/wishlistModel')
const cartController = require('../controllers/cartController');
const bcrypt = require('bcrypt');
const { default: mongoose } = require("mongoose");
const { json } = require("express");
const Otp = require('../models/Otp');
const Brands = require('../models/brandsModel');
const Products = require('../models/productModel');

// otp verification function
const otpGenrator = () => {
    return `${Math.floor(1000 + Math.random() * 9000)}`;
}

const sendOtp = async (req, res) => {
    try {
        if (!req.session.user) {
            throw new Error('User email is not set in session');
        }

        const otp = otpGenrator();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASSWORD,
            },
        });

        const mailGenerator = new mailgen({
            theme: "default",
            product: {
                name: "Choco Heaven",
                link: "https://mailgen.js/",
            },
        });

        const response = {
            body: {
                name: req.session.user,
                intro: "Your OTP for Choco Heaven verification is",
                table: {
                    data: [{ OTP: otp }]
                },
                outro: "Looking forward to doing more business",
            }
        };

        const mail = mailGenerator.generate(response);

        const message = {
            from: process.env.AUTH_EMAIL,
            to: req.session.user,
            subject: "Choco Heaven OTP Verification",
            html: mail
        };

        const newOtp = new OTP({
            email: req.session.user,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000 // 1 minute from now
        });

        await newOtp.save();
        req.session.otpId = newOtp._id;
        await transporter.sendMail(message);

    } catch (error) {
        console.log(error.message);
        throw error;
    }
}


// forgot password OTP

const forgotPasswordOtp = async (req, res) => {
    const otp = otpGenrator();

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        },
    })

    const mailGenerator = new mailgen({
        theme: "default",
        product: {
            name: "Choco Heaven",
            link: "https://mailgen.js/",
        },
    })
    const response = {
        body: {
            name: req.session.forgotUser,
            intro: "your OTP for Choco Heaven verification is",
            table: {
                data: [{
                    OTP: otp
                }]
            },
            outro: "Looking forward to doing more business",
        }
    }

    const mail = mailGenerator.generate(response)

    const message = {
        from: process.env.AUTH_EMAIL,
        to: req.session.forgotUser,
        subject: "Choco Heaven OTP Verification",
        html: mail
    }
    try {
        const newOtp = new OTP({
            email: req.session.forgotUser,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30000
        })

        const data = await newOtp.save()
        req.session.forgotOtpId = data._id
        await transporter.sendMail(message);

    } catch (error) {
        console.log(error.message);

    }
}

// resend otp 
const resendOtpGenrator = () => {
    return `${Math.floor(1000 + Math.random() * 9000)}`;
}

const resendOtp = async (req, res) => {
    const otp = resendOtpGenrator();

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        },
    })

    const mailGenerator = new mailgen({
        theme: "default",
        product: {
            name: "Choco Heaven",
            link: "https://mailgen.js/",
        },
    })
    const response = {
        body: {
            name: req.session.user,
            intro: "your OTP for Choco Heaven verification is",
            table: {
                data: [{
                    OTP: otp
                }]
            },
            outro: "Looking forward to doing more business",
        }
    }

    const mail = mailGenerator.generate(response)

    const message = {
        from: process.env.AUTH_EMAIL,
        to: req.session.user,
        subject: "Choco Heaven OTP Verification",
        html: mail
    }

    try {
        const newOtp = new OTP({
            email: req.session.user,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30000
        })

        const data = await newOtp.save()

        req.session.otpId = data._id
        await transporter.sendMail(message);
    } catch (error) {
        console.log(error.message);
    }


}

const loginLoad = async (req, res) => {
    try {
        res.render('userLogin')
    } catch (error) {
        console.log(error.message);
    }
}

const forgotPasswordPage = async (req, res, next) => {
    try {
        res.render('verifyEmail')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const email = req.body.email;
        const isUser = await User.findOne({ email: email })

        if (!req.body) {
            return res.render('verifyEmail', { warning: "Enter Email your email" })
        }
        if (!isUser) {
            return res.render('verifyEmail', { message: "Sorry, Your Email not found. Please try again with other Email." })
        }

        req.session.forgotUserId = isUser._id
        req.session.forgotUser = req.body.email

        forgotPasswordOtp(req, res);
        res.render('forgotOtp', { userEmail: email });

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const forgotOtpVerify = async (req, res, next) => {
    try {
        const userEmail = req.session.forgotUser;

        if (!req.body || !req.body.verifyOtp) {
            return res.status(400).render('forgotOtp', { userEmail: userEmail, message: "Please enter the OTP" });
        }

        const otpUserData = await Otp.findOne({ email: userEmail });
        if (!otpUserData) {
            return res.status(404).render('forgotOtp', { userEmail: userEmail, message: "OTP session expired or invalid. Please try again." });
        }

        const otpUser = otpUserData.otp;
        const otp = parseInt(req.body.verifyOtp.join(""));

        // Check if OTP is within valid timeframe
        const currentTime = new Date();
        const otpAgeInSeconds = (currentTime - otpUserData.createdAt) / 1000;

        if (otpAgeInSeconds > 60) { // 1 minute
            return res.status(400).render('forgotOtp', { userEmail, message: "OTP has expired", incorrectOtp: false });
        }

        if (otp === otpUser) {
            const userData = await User.findOne({ email: userEmail });
            userData.is_Verified = true;
            await userData.save();

            res.render('changePassword', { success: "OTP verified! You can now log in." });
        } else {
            return res.status(400).render('forgotOtp', { userEmail, incorrectOtp: true });
        }
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const userId = req.session.forgotUserId
        const { newPassword, confirmPassword } = req.body


        if (newPassword != confirmPassword) {
            return res.status(403), json({ warning: "Password doesn't match.check your password" })
        }

        const spassword = await securePassword(newPassword)
        const updatePassword = await User.findByIdAndUpdate({ _id: userId }, { $set: { password: spassword } })
        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

// Route to render the change password page
const resetPasswordPageLoad = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(400).send("Invalid session. Please log in again.");
        }

        res.render('changePasswordUser'); 
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

// Function to compare passwords
const comparePassword = async (enteredPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(enteredPassword, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

const resetPasswordForUser = async (req, res, next) => {
    try {
        const userId = req.session.userId; // Use session userId
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Compare the current password with the hashed password in the database
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect." });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in the database
        user.password = hashedPassword;
        await user.save();

        // Respond with success and redirect URL
        res.status(200).json({ success: "Password updated successfully", redirectUrl: "/profileDetails" });

    } catch (error) {
        console.error(error.message);
        next(error);
    }
};


const loadHome = async (req, res) => {
    try {
        let userId = req.session.userId ? req.session.userId : '';
        const productData = await Products.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('brandId', 'name');
        
        let cartCount = userId ? await cartController.getCartCount(userId) : 0;


        let wishlistItems = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId: userId });
            wishlistItems = wishlist ? wishlist.wishlistItems.map(item => item.toString()) : [];
        }        

        const brands = await Brands.find({}); // Fetch all brands

        if (userId) {
            const userData = await User.findById({ _id: userId });
            res.render('userHome', { user: userData, products: productData, cartCount, wishlistItems,brands, isLoggedIn: true });
        } else {
            res.render('userHome', { userId: userId, products: productData, cartCount, brands, wishlistItems, isLoggedIn: false });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;

    } catch (error) {
        console.log(error.message);

    }
}

const loadShop = async (req, res) => {
    try {
        let userId = req.session.userId;
        let { 
            sort = "createdAt-desc",
            page = 1,
            search = "",
            brands = [],
            minPrice = 0,
            maxPrice = 5000 
        } = req.query;

        if (typeof brands === 'string') {
            brands = brands.split(',');
        }

        // Validate each brandId to ensure it's a valid MongoDB ObjectId
        brands = brands.filter(brand => mongoose.Types.ObjectId.isValid(brand)).map(brand => new mongoose.Types.ObjectId(brand));

        const productPerPage = 6;
        let sortQuery = {};
        sort = sort.split('-');
        sortQuery[sort[0]] = sort[1] === 'asc' ? 1 : -1;

        let wishlistItems = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId: userId });
            wishlistItems = wishlist ? wishlist.wishlistItems.map(item => item.toString()) : [];
        }

        const skip = (page - 1) * productPerPage;

        let searchQuery = { 
            isDeleted: false,
            price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) }  // Ensure minPrice and maxPrice are numbers
        };

        if (search) {
            searchQuery.$or = [
                { productName: { $regex: `^${search}$`, $options: "i" } },  // Exact match
                { productName: { $regex: `^${search}`, $options: "i" } },   // Starts with
                { productName: { $regex: search, $options: "i" } }          // Contains
            ];
        }

        if (brands.length > 0) {
            searchQuery.brandId = { $in: brands };
        }

        const brandsData = await Brands.find({ isDeleted: false });
        const allProduct = await Products.find({ isDeleted: false });

        // Fetch product count for each brand
        const brandProductCount = await Products.aggregate([
            { $match: searchQuery },
            { $group: { _id: "$brandId", count: { $sum: 1 } } }
        ]);

        const brandCountMap = brandProductCount.reduce((map, obj) => {
            map[obj._id.toString()] = obj.count;
            return map;
        }, {});

        const totalProduct = await Products.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProduct / productPerPage);

        // Fetch the product data, and apply the sorting based on the priority
        const productData = await Products.find(searchQuery)
            .sort(sortQuery)
            .populate('brandId', 'name')
            .skip(skip)
            .limit(productPerPage);

        let cartCount = userId ? await cartController.getCartCount(userId) : 0;

        // Render the response with the updated data
        res.render('shop', { 
            user: req.session.userId ? await User.findById({ _id: userId }) : null,
            products: productData, 
            brands: brandsData,
            allProduct,
            page, 
            totalPages, 
            wishlistItems,
            cartCount, 
            isLoggedIn: !!req.session.userId, 
            search,
            minPrice: minPrice,  
            maxPrice: maxPrice,
            selectedBrands: brands.map(id => id.toString())
        });

    } catch (error) {
        console.log(error.message);
    }
};


const loadProduct = async (req, res, next) => {
    try {
        let userId = req.session.userId;
        const id = req.query.id;

        // Fetch the specific product
        const productData = await Products.findOne({ _id: id, isDeleted: false })
            .populate('brandId', 'name');

        let wishlistItems = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId: userId });
            wishlistItems = wishlist ? wishlist.wishlistItems.map(item => item.toString()) : [];
        }

        // Fetch related products sorted by discountPrice in descending order
        const relatedProducts = await Products.find({ isDeleted: false }).sort({ discountPrice: -1 });

        // Fetch suggestion products sorted by discountPrice in ascending order or any other criteria
        const suggestionProducts = await Products.find({ isDeleted: false }).sort({ discountPrice: 1 });

        const popularProducts = await Products.find({ isDeleted: false, popularProduct: true });
        const brandsList = await Brands.find({ isDeleted: false }); 
        let cartCount = userId ? await cartController.getCartCount(userId) : 0;
        let price = productData.discountPrice;

        const brands = await Brands.find({});

        let offer = null;

        if (productData.offer.length > 0) {
            const offerIndex = productData.offer.length - 1;
            const offerId = productData.offer[offerIndex];

            offer = await Offer.findById(offerId);
            price = price - (price * offer.discount) / 100;

            if (price > offer.maxRedeemAbelAmount) {
                price = offer.maxRedeemAbelAmount;
            }
        }

        if (req.session.userId) {
            const userData = await User.findById({ _id: req.session.userId });
            res.render('singleProduct', { user: userData, product: productData, popularProducts, wishlistItems, brands: brandsList, brands, price, relatedProducts, suggestionProducts, offer, cartCount, isLoggedIn: true });
        } else {
            res.render('singleProduct', { product: productData, brands: brandsList, popularProducts, wishlistItems, price, brands, relatedProducts, suggestionProducts, offer, cartCount, isLoggedIn: false });
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const generateOTP = () => {
    return crypto.randomBytes(3).toString('hex'); 
}

const loadSignUp = async (req, res) => {
    try {
        res.render('userSignUp');
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        // Server-side validation for empty fields
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.render('userSignUp', { warning: "Please enter all details to sign up" });
        }

        // Check if first and last names are valid
        const nameRegex = /^[a-zA-Z]+$/;
        if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
            return res.render('userSignUp', { message: "Please enter a valid name. Only alphabetic characters are allowed." });
        }

        // Check if email format is valid
        if (!validateEmail(email)) {
            return res.render('userSignUp', { message: "Please enter a valid email address" });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.render('userSignUp', { message: "Passwords do not match, please try again" });
        }

        // Check if email is already taken
        const isExistingUser = await User.findOne({ email });
        if (isExistingUser) {
            return res.render('userSignUp', { warning: "This email is already taken, please try with another email" });
        }

        // Hash the password and create a new user
        const spassword = await securePassword(password);
        const user = new User({
            firstName,
            lastName,
            email,
            password: spassword,
            is_is_Admin: false
        });

        // Save the user session and send OTP
        req.session.userData = user;
        req.session.user = email;
        const userEmail = req.session.user;

        await sendOtp(req, res);
        res.render('verifyOtp', { userEmail });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

// Email validation function
function validateEmail(email) {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
}


    
const otpLoad = async(req,res)=>{
    try{
        res.render('verifyOtp')
    }catch(err){

    }
}

const ResendOtp = async (req, res) => {
    try {
        const userEmail = req.session.user

        await resendOtp(req, res)
        res.render('verifyOtp', { userEmail });
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp = async (req, res, next) => {
    try {
        const userEmail = req.session.user;
        // Check if OTP is provided and not empty
        if (!req.body.verifyOtp || req.body.verifyOtp.some(value => value === '')) {
            return res.status(400).render('verifyOtp', { userEmail, message: "Please enter OTP", incorrectOtp: false });
        }

        const otpUserData = await OTP.findOne({ _id: req.session.otpId });
        if (!otpUserData) {
            return res.status(400).render('verifyOtp', { userEmail, message: "OTP not found", incorrectOtp: false });
        }
        const otpUser = otpUserData.otp;
        const otp = parseFloat(req.body.verifyOtp.join(""));
        // Check if OTP is within valid timeframe
        const currentTime = new Date();
        const otpAgeInSeconds = (currentTime - otpUserData.createdAt) / 1000;

        if (otpAgeInSeconds > 60) { // 1 minute
            return res.status(400).render('verifyOtp', { userEmail, message: "OTP has expired", incorrectOtp: false });
        }

        if (otp == otpUser) {
            const userData = req.session.userData;
            userData.is_Verified = true;
            await User.create(userData);
        
            res.render('userLogin', { success: "OTP verified! You can now log in." });
        } else {
            // When OTP is incorrect, send the incorrectOtp flag
            return res.status(400).render('verifyOtp', { userEmail, incorrectOtp: true });
        }              
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

const verifyLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email or password is empty
        if (!email || !password) {
            return res.render('userLogin', { warning: "Please enter both email and password to sign in." });
        }

        // Find the user by email
        const userData = await User.findOne({ email: email });

        if (userData) {
            // Compare provided password with stored hash
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_block === false) {
                    req.session.userId = userData._id;
                    return res.redirect('/home');
                } else {
                    return res.render('userLogin', { message: "Your account is blocked." });
                }
            } else {
                return res.render('userLogin', { message: "User email or password is incorrect." });
            }
        } else {
            return res.render('userLogin', { message: "User email or password is incorrect." });
        }

    } catch (error) {
        console.log(error.message);
        next(error); 
    }
};


// google authentication
const googleAuth = async (req, res) => {
    try {
        const { email, given_name, family_name, sub } = req.user;

        let user = await User.findOne({ email: email });

        if (user) {
            if (!user.googleId) {
                user.googleId = sub;
                user.is_Verified = true;
                await user.save();
            }
        } else {
            user = new User({
                firstName: given_name,
                lastName: family_name,
                email: email,
                googleId: sub,
                is_Verified: true
            });
            await user.save();
        }
        req.session.userId = user._id

        res.redirect('/home');

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during Google authentication');
    }
};

const userProfileLoad = async (req, res, next) => {
    try {
        let userId = req.session.userId;
        const userData = await User.findById({ _id: userId });

        if (userData.is_block) {
            return res.redirect('/logout');
        }

        const address = await Address.findOne({ user_id: userId }).sort({ _id: 1 });

        res.render('userProfile', { user: userData, address: address });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const updateProfileLoad = async (req, res) => {
    try {

        let userId = req.session.userId
        const userData = await User.findById({ _id: userId })

        res.render('updateProfile', { user: userData })
        
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const imageFile = req.file ? req.file.filename : null;

        const updatedData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            favorite: req.body.favorite || 'No favorite',
            bio: req.body.bio || 'No bio',
            phone: req.body.phone
        };

        if (imageFile) {
            updatedData.image = imageFile;
        }

        const userData = await User.findByIdAndUpdate(
            userId,
            { $set: updatedData },
            { new: true }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Profile update failed' });
        next(error);
    }
};

const addressManageLoad = async (req, res, next) => {
    try {
        let userId = req.session.userId

        const userData = await User.findById({ _id: userId })
        const address = await Address.find({ user_id: userId })

        res.render('addressManage', { user: userData, address: address })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const saveAddress = async (req, res) => {
    try {
        const id = req.session.userId
        const user = await User.findById(id)
        const email = user.email

        if (!req.body.is_Home && !req.body.is_Work) {
            return res.status(403).json({ message: "please select address type" })
        }

        let userAddress = new Address(req.body)
        userAddress.user_id = id
        userAddress.email = email

        await userAddress.save()
        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error.message);
    }
}

const editAddress = async (req, res, next) => {
    try {
        const id = req.session.userId;
        const edit = await Address.updateOne({ user_id: id }, { $set: req.body });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error.message);
        next(error);
    }
}

const userLogout = async (req, res, next) => {
    try {
        req.session.destroy();
        res.redirect('/home')
    } catch (error) {
        next(error)
    }
}

const deleteAddress = async (req, res) => {
    try {
        const id = req.query.id
        if (id) {
            await Address.deleteOne({ _id: id })
            return res.redirect('/addressManage')
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadSignUp,
    loginLoad,
    securePassword,
    otpLoad,
    verifyOtp,
    googleAuth,
    forgotPasswordPage,
    verifyEmail,
    resetPassword,
    loadHome,
    loadShop,
    loadProduct,
    ResendOtp,
    forgotOtpVerify,
    verifyLogin,
    userProfileLoad,
    updateProfileLoad,
    updateProfile,
    addressManageLoad,
    saveAddress,
    editAddress,
    resetPasswordPageLoad,
    resetPasswordForUser,
    deleteAddress,
    userLogout,
    addUser
}
