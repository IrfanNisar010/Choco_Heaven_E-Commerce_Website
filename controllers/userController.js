const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const OTP = require('../models/Otp')
const crypto = require('crypto');
const mailgen = require('mailgen');
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
        const newOtp = new otpModel({
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
        res.render('forgotPassword')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}
const forgotOtpVerify = async (req, res) => {
    try {

        const userEmail = req.session.forgotUser;

        if (!req.body || !req.body.otp) {
            return res.status(400).render('forgotOtp', { userEmail:userEmail, message: "Please enter OTP" });
        }


        const otpUserData = await otpModel.findOne({ email: userEmail });
        if (!otpUserData) {
            return res.status(404).render('forgotOtp', { userEmail:userEmail, message: "OTP session expired or invalid. Please try again." });
        }

        const otpUser = otpUserData.otp;
        const otp = parseFloat(req.body.otp.join(""));


        if (otp === otpUser) {
            res.render('resetPassword');
        } else {
            res.status(400).render('forgotOtp', { userEmail, message: "Incorrect OTP" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const userId = req.session.forgotUserId
        const { newPassword, cnfmPassword } = req.body


        if (newPassword != cnfmPassword) {
            return res.status(403), json({ message: "Password dosn't Match" })
        }

        const spassword = await securePassword(newPassword)
        const updatePassword = await User.findByIdAndUpdate({ _id: userId }, { $set: { password: spassword } })
        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const loadHome = async (req, res) => {
    try {
        let userId = req.session.userId ? req.session.userId : '';
        const productData = await Products.find({ isDeleted: false }).sort({ createdAt: -1 })
        const brandsData = await Brands.find({ isDeleted: false })
        if (req.session.userId) {
            const userData = await User.findById({ _id: userId });
            res.render('userHome', { user: userData, products: productData, brands: brandsData })
        }
        else {
            res.render('userHome', { products: productData, brands: brandsData })
        }
    } catch (error) {
        console.log(error.message);
    }
}

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
        let userId = req.session.userId

        const productData = await Products.find({ isDeleted: false })
        const brandsData = await Brands.find({ isDeleted: false })
        const allProduct = await Products.find({ isDeleted: false })


        if (req.session.userId) {
            const userData = await User.findById({ _id: userId })
            res.render('shop', { user: userData, products: productData, brands:brandsData,allProduct })
        } else {
            res.render('shop', { products: productData, allProduct, brands:brandsData, allProduct })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadProduct = async (req, res, next) => {
    try {
        const id = req.query.id;
        const productData = await Products.findOne({ _id: id, isDeleted: false });
        const products = await Products.find({ isDeleted: false }); 
        let price = productData.discountPrice;

        if (req.session.userId) {
            const userData = await User.findById({ _id: req.session.userId });
            res.render('singleProduct', { user: userData, product: productData, price, products });
        } else {
            res.render('singleProduct', { product: productData, price, products });
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
        // Check if required fields are empty
        if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.password || !req.body.confirmPassword) {
            return res.render('userSignUp', { message: "Please enter all details to sign up" });
        }

        // Check if passwords match
        if (req.body.password !== req.body.confirmPassword) {
            return res.render('userSignUp', { password: "Passwords do not match, please try again" });
        }

        // Check if email is already taken
        if (req.body.email) {
            const isExistingUser = await User.findOne({ email: req.body.email });
            if (isExistingUser) {
                return res.render('userSignUp', { message: "This email is already taken, please try with another email" });
            }
        }

        const spassword = await securePassword(req.body.password)
        const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: spassword,
            is_is_Admin: false

        })

        req.session.userData = user
        req.session.user = req.body.email
        const userEmail = req.session.user

        await sendOtp(req, res)
        res.render('verifyOtp', { userEmail });


    } catch (error) {
        console.log(error.message);
        next(error)
    }
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
            const userData = req.session.userData
            userData.is_Verified = true
            await User.create(userData)

            res.render('userLogin' , {success: "OTP verified! You can now log in."})
        } else {
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
                    // Set session data for logged in user
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
        next(error); // Pass the error to the error-handling middleware
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

const userLogout = async (req, res, next) => {
    try {
        req.session.destroy();
        res.redirect('/home')
    } catch (error) {
        next(error)
    }
}

module.exports = {
    loadSignUp,
    loginLoad,
    securePassword,
    otpLoad,
    verifyOtp,
    googleAuth,
    forgotPasswordOtp,
    loadHome,
    loadShop,
    loadProduct,
    ResendOtp,
    verifyLogin,
    userLogout,
    addUser
}
