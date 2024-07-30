const User = require('../models/userModel')
const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const OrderModel = require('../models/orderModel')
const Offer = require('../models/offerModel')
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

const checkoutPageLoad = async (req, res, next) => {
    try {
        const id = req.session.userId
        const productId = req.query.productId

        const userData = await User.findById({_id: id})
        const userAddress = await Address.find({user_id: id})
        let productData = [];
        if (productId) {
            let product = await Products.findById(productId)

            product = product.toObject()
            product.productId = product._id
            productData.push(product)
            let totalPrice = product.discountPrice;

            if (product.offer.length > 0) {
                const offerIndex = product.offer.length - 1
                const offerId = product.offer[offerIndex]

                const offer = await Offer.findById(offerId)
                totalPrice = totalPrice - (totalPrice * offer.discount) / 100

                if (totalPrice > offer.maxRedeemAbelAmount) {
                    totalPrice = offer.maxRedeemAbelAmount
                }

                req.session.offerId = offer._id
            } else {
                req.session.totalAmount = totalPrice + 60
            }
            res.render('checkout', { user: userData, userAddress, productData, totalPrice })
        } else {
            const products = await Cart.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(id) } },
                { $unwind: '$cartItems' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'cartItems.productId',
                        foreignField: '_id',
                        as: 'productDetails',
                    }
                },
                {
                    $project: {
                        product: { $arrayElemAt: ['$productDetails', 0] },
                        quantity: '$cartItems.quantity'
                    }
                }
            ]);

            let totalPrice = 0;
            productData = products.map(async (item) => {
                let productPrice = item.product.discountPrice;
                let extendedPrice = productPrice * item.quantity;

                if (item.product.offer && item.product.offer.length > 0) {
                    const offerIndex = item.product.offer.length - 1;
                    const offerId = item.product.offer[offerIndex];
                    const offer = await Offer.findById(offerId);
                    productPrice -= (productPrice * offer.discount) / 100;
                    if (productPrice > offer.maxRedeemAbelAmount) {
                        productPrice = offer.maxRedeemAbelAmount;
                    }

                    extendedPrice = productPrice * item.quantity;
                }

                totalPrice += extendedPrice;
                return {
                    productId: item.product._id,
                    productName: item.product.productName,
                    discountPrice: productPrice,
                    brand: item.product.brand,
                    price: item.product.price,
                    size: item.product.size,
                    category: item.product.category,
                    discount: item.product.discount,
                    image: item.product.image,
                    inStock: item.product.inStock,
                    quantity: item.quantity,
                    offer: item.product.offer,
                    extendedPrice: extendedPrice
                };
            });

            productData = await Promise.all(productData);
            res.render('checkout', { user: userData, userAddress, productData, totalPrice})

        }

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const createOrder = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(403).json({ message: "User is not authenticated." });
        }

        const userId = req.session.userId;
        const { addressId, paymentMethod } = req.body;

        // Validate request body
        if (!addressId || !paymentMethod) {
            return res.status(400).json({ message: "Address ID and payment method are required." });
        }

        // Fetch user data, address
        const userData = await User.findById(userId);
        const userAddress = await Address.findById(addressId);

        // Fetch products from session
        const products = req.session.products;

        // Check product stock
        for (let product of products) {
            if (product.inStock <= 0) {
                return res.status(403).json({ message: "Product is Out of Stock!!" });
            }
        }

        // Prepare order items
        const orderItems = products.map(product => ({
            productId: product._id,
            quantity: product.quantity,
            price: product.price
        }));

        // Create order
        const order = new OrderModel({
            userId: userId,
            orderItems: orderItems,
            paymentMethod: paymentMethod,
            address: userAddress,
            totalAmount: req.session.totalAmount,
        });

        // Save order
        await order.save();

        // Update product stock
        for (const item of orderItems) {
            await Products.findByIdAndUpdate(
                item.productId,
                {
                    $inc: { inStock: -item.quantity },
                    $set: { popularProduct: true }
                }
            );
        }

        // Respond with success message
        return res.json({
            success: true,
            message: "Order created successfully.",
            orderId: order._id,
            amount: order.totalAmount * 100,
        });

    } catch (error) {
        console.error('Create Order Failed:', error);
        next(error);
    }
};

module.exports = {
    ordersPageLoad,
    checkoutPageLoad,
    createOrder

}