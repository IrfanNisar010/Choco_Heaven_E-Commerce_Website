const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const orderModel = require('../models/brandsModel')
const User = require('../models/userModel')

const couponManageLoad = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1; 
        const couponPerPage = 10; 
        const skip = (currentPage - 1) * couponPerPage;
        
        const searchQuery = req.query.search || ''; // Get the search query from request
        const searchRegex = new RegExp(searchQuery, 'i');

        const coupons = await Coupon.find({
            $or: [
                { couponName: searchRegex },
                { couponCode: searchRegex }
            ]
        }).skip(skip).limit(couponPerPage);

        const totalCoupons = await Coupon.countDocuments({
            $or: [
                { couponName: searchRegex },
                { couponCode: searchRegex }
            ]
        });
        const totalPages = Math.ceil(totalCoupons / couponPerPage);

        res.render('couponManageAdmin', { 
            coupons: coupons, 
            currentPage: currentPage, 
            totalPages: totalPages,
            searchQuery: searchQuery
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const addCouponLoad = async (req, res, next) => {
    try {
        res.render('addCoupon')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const addCoupon = async (req, res, next) => {
    try {
        const {couponName, couponCode, discountPercentage, expiredDate, minPurchaseAmt, maxRedeemAbelAmount, description } = req.body


        const isExist = await Coupon.findOne({ couponCode: couponCode })
        if (isExist) {
            return res.status(403).json({ message: "This CODE is already exist, please enter another one" })
        } else if (couponCode[0] == ' ') {
            return res.status(403).json({ message: "Enter Proper Coupon Code" })

        }


        const coupon = new Coupon({
            couponName: couponName,
            couponCode: couponCode,
            discountPercentage: discountPercentage,
            expiredDate: expiredDate,
            description: description,
            minPurchaseAmt: minPurchaseAmt,
            maxRedeemAbelAmount: maxRedeemAbelAmount
        })

        await coupon.save()
        res.status(200).json({ success: true })

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const couponStatusChange = async (req, res, next) => {
    try {
        const id = req.query.couponId;
        const coupon = await Coupon.findById({ _id: id })
        coupon.status = !coupon.status
        await coupon.save()

        let message = coupon.status ? "Coupon Activated successfully" : "Coupon Inactivated successfully";

        res.status(200).json({ message })

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const showCouponForUser = async (req, res, next) => {
    try {
        const user = await User.findById({ _id: req.session.userId });
        
        const page = parseInt(req.query.page) || 1;
        const perPage = 10; // Number of coupons per page

        const coupons = await Coupon.find({ status: true })
            .skip((page - 1) * perPage) // Skip the first (page - 1) * perPage items
            .limit(perPage); // Limit to perPage items

        const totalCoupons = await Coupon.countDocuments({ status: true });

        const totalPages = Math.ceil(totalCoupons / perPage);

        res.render('couponManage', { 
            user, 
            coupons, 
            title: "Coupons", 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const applyCoupon = async (req, res, next) => {
    try {
        const { couponCode, totalAmount } = req.body;
        const data = await Coupon.findOne({ status: true, couponCode: couponCode });

        if (data !== null && data.minPurchaseAmt > totalAmount) {
            res.status(400).json({ message: `This coupon is only valid for purchases over ${data.minPurchaseAmt}` });
        } else if (data !== null) {
            // Calculate discount amount
            const discountAmount = (totalAmount * data.discountPercentage) / 100;
            const newTotalAmount = totalAmount - discountAmount;

            // Store coupon information in session
            req.session.coupon = data.discountPercentage;
            req.session.couponId = data._id;

            // Return the coupon details and the new total amount
            res.status(200).json({
                success: true,
                couponCode: data.couponCode,
                discountAmount: discountAmount.toFixed(2),
                newTotalAmount: newTotalAmount.toFixed(2)
            });
        } else {
            res.status(400).json({ message: "Coupon code is incorrect!" });
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const removeCoupon = async (req, res, next) => {
    try {

        if (req.session.coupon && req.session.couponId) {
            delete req.session.coupon
            delete req.session.couponId
            res.status(200).json({ success: true })
        } else {
            res.status(400).json({ message: "No coupon applied." })
        }


    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

module.exports = {
    couponManageLoad,
    addCoupon,
    addCouponLoad,
    couponStatusChange,
    showCouponForUser,
    applyCoupon,
    removeCoupon
}