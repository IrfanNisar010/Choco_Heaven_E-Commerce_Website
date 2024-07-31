const User = require('../models/userModel');
const Products = require('../models/productModel');
const Brands = require('../models/brandsModel');
const Cart = require('../models/cartModel');
const mongoose = require("mongoose");

const cartLoad = async (req, res, next) => {
    try { 
        const userId = req.session.userId;
        const userData = await User.findById({ _id: userId });

        const userCart = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$cartItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: "cartItems.productId",
                    foreignField: "_id",
                    as: "productDetails",
                }
            }
        ]);

        const totalPriceResult = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$cartItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'cartItems.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $project: {
                    _id: 0,
                    totalPrice: { $multiply: ['$productDetails.discountPrice', '$cartItems.quantity'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: '$totalPrice' }
                }
            }
        ]);

        const totalPrice = totalPriceResult.length > 0 ? totalPriceResult[0].totalPrice : 0;

        if (userCart.length === 0) {
            return res.render('cart', { user: userData, userCart: [], message: 'Your cart is empty.' });
        }

        res.render('cart', { user: userData, userCart: userCart, totalPrice });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const addToCart = async (req, res, next) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ redirectUrl: '/login' });
        }

        // Validate productId
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required." });
        }

        // Find the product to ensure it exists (optional, but recommended)
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            cart = new Cart({
                userId: userId,
                cartItems: [{ productId: productId, quantity: 1 }]
            });
        } else {
            const existingItem = cart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.cartItems.push({ productId: productId, quantity: 1 });
            }
        }

        await cart.save();
        res.status(200).json({ message: "Product added to cart" });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const removeFromCart = async (req, res, next) => {
    try {
        const userID = req.session.userId;
        const productId = req.query.productId;

        const cartData = await Cart.findOne({ userId: userID });
        const index = cartData.cartItems.findIndex((value) => {
            return value.productId.toString() === productId;
        });

        if (index !== -1) {
            cartData.cartItems.splice(index, 1);
            await cartData.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Product not found in cart' });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
        next(error);
    }
}


const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.query.productId;
        const change = parseInt(req.query.change);

        let cart = await Cart.findOne({ userId: userId });

        const index = cart.cartItems.findIndex(item => item.productId.equals(productId));

        if (index !== -1) {
            cart.cartItems[index].quantity += change;

            if (cart.cartItems[index].quantity <= 0) {
                cart.cartItems.splice(index, 1);
            }
        }

        let savedCart = await cart.save();
        res.status(200).json({ savedCart });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}


const getCartCount = async (userId) => {
    try {
        if (!userId) {
            return 0;
        }
        
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return 0;
        }
        
        return cart.cartItems.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
        console.log(error.message);
        return 0;
    }
};

module.exports = {
    cartLoad,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartCount
};
