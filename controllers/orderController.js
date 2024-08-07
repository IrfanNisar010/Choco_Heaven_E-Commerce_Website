const User = require('../models/userModel')
const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const OrderModel = require('../models/orderModel')
const Offer = require('../models/offerModel')
const { default: mongoose } = require("mongoose");
const { render } = require('ejs')

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
        if (!req.session || !req.session.userId) {
            return res.status(403).json({ message: "User is not authenticated." });
        }

        const userId = req.session.userId;
        const { addressId, paymentMethod } = req.body;

        // Retrieve user address
        const userAddress = await Address.findById(addressId);
        if (!userAddress) {
            return res.status(404).json({ message: "Address not found." });
        }

        // Retrieve the cart items for the user
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
        if (!cart || cart.cartItems.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }

        // Check stock for each product in the cart
        for (let item of cart.cartItems) {
            const product = item.productId;
            if (!product || product.inStock < item.quantity) {
                return res.status(403).json({ message: `Product ${product.name} is out of stock!` });
            }
        }

        // Check payment method constraints
        if (paymentMethod === 'COD' && req.session.totalAmount > 1000) {
            return res.status(403).json({ message: "COD only available for products below ₹1000!" });
        }

        // Calculate total amount
        const totalAmount = cart.cartItems.reduce((acc, item) => {
            const product = item.productId;
            return acc + item.quantity * product.discountPrice;
        }, 0) + 40; // Add shipping cost

        const orderItems = cart.cartItems.map(item => {
            const product = item.productId;
            return {
                productId: product._id,
                quantity: item.quantity,
                productName: product.name,
                brandId: product.brandId,
                model: product.model,
                description: product.description,
                price: product.price,
                discountPrice: product.discountPrice,
                discount: product.discount,
                image: product.image
            };
        });

        const order = new OrderModel({
            userId: userId,
            orderItems: orderItems,
            paymentMethod: paymentMethod,
            address: {
                Name: userAddress.name,
                email: userAddress.email,
                Mobile: userAddress.Mobile,
                PIN: userAddress.PIN,
                street: userAddress.street,
                address: userAddress.address,
                city: userAddress.city,
                state: userAddress.state,
                country: userAddress.country,
                landmark: userAddress.landmark,
                is_Home: userAddress.is_Home,
                is_Work: userAddress.is_Work
            },
            totalAmount: totalAmount,
            orderStatus: paymentMethod === 'COD' ? "order confirmed" : "pending" // Adjust based on payment method
        });

        if (req.session.coupen && req.session.coupenId) {
            order.coupenId = req.session.coupenId;
        }

        await order.save();

        // Update stock for each product
        for (let item of cart.cartItems) {
            await Products.findByIdAndUpdate(item.productId, {
                $inc: { inStock: -item.quantity },
                $set: { popularProduct: true }
            });
        }

        // Clear the cart after order is placed
        await Cart.findOneAndDelete({ userId: userId });

        return res.json({
            success: true,
            message: "Order created successfully.",
            orderId: order._id
        });
    } catch (error) {
        console.error('Create Order Failed:', error);
        next(error);
    }
};

const adminOrderPageLoad = async(req,res, next) => {
    try {
        res.render('adminOrderManage')
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    ordersPageLoad,
    checkoutPageLoad,
    createOrder,
    adminOrderPageLoad

}