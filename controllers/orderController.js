const User = require('../models/userModel')
const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const OrderModel = require('../models/orderModel')
const { default: mongoose } = require("mongoose");

const ordersPageLoad = async (req, res, next) => {
    try {
        const id = req.session.userId
        const userData = await User.findById({ _id: id })


        const totalProduct = await OrderModel.countDocuments()

        const orders = await OrderModel.find({ userId: id }).sort({ orderDate: -1 })
        
        res.render('orderManage', { user: userData, orders})
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}



module.exports = {
    ordersPageLoad,
}