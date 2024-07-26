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

        let totalMRP = 0;
        let totalDiscount = 0;
        let totalPrice = 0;
        let shipping = 0;

        userCart.forEach(cartItem => {
            const originalPrice = cartItem.productDetails[0].price;
            const discountPrice = cartItem.productDetails[0].discountPrice || originalPrice;
            const quantity = cartItem.cartItems.quantity;

            totalMRP += originalPrice * quantity;
            totalPrice += discountPrice * quantity;
            totalDiscount += (originalPrice - discountPrice) * quantity;
        });

        if (userCart.length > 3) {
            shipping = 0; // Free shipping
        } else {
            shipping = 40; // Shipping cost is ₹40
        }

        if (userCart.length === 0) {
            return res.render('cart', { user: userData, userCart: [], message: 'Your cart is empty.' });
        }

        res.render('cart', {
            user: userData,
            userCart: userCart,
            totalMRP,
            totalDiscount,
            totalPrice,
            shipping
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const addToCart = async (req, res, next) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ redirectUrl: '/login' });
        }

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            cart = new Cart({
                userId: userId,
                cartItems: [{ productId: productId }]
            });
        } else {
            const existingItem = cart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.cartItems.push({ productId: productId });
            }
        }

        await cart.save();
        res.status(200).json({ addToCart: "Added to cart" });
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

        cartData.cartItems.splice(index, 1);
        await cartData.save();
        res.redirect("/cart");
    } catch (error) {
        console.log(error.message);
        next(error)
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

        await cart.save();
        res.sendStatus(200)

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    cartLoad,
    addToCart,
    removeFromCart,
    updateQuantity
};
