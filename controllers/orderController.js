const User = require('../models/userModel')
const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const OrderModel = require('../models/orderModel')
const Wallet  = require('../models/walletModel')
const Razorpay = require('razorpay')
const crypto  = require('crypto')
const Offer = require('../models/offerModel')
const { default: mongoose } = require('mongoose');
const { render } = require('ejs')

// RazorPay instance 
var razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

const ordersPageLoad = async (req, res, next) => {
    try {
        const id = req.session.userId;
        const userData = await User.findById(id);

        // Define the number of orders per page
        const ordersPerPage = 3;

        // Get the current page number from the query parameters, default to 1 if not specified
        const currentPage = parseInt(req.query.page) || 1;

        // Calculate the total number of orders
        const totalOrders = await OrderModel.countDocuments({ userId: id });

        // Calculate the number of pages
        const totalPages = Math.ceil(totalOrders / ordersPerPage);

        // Fetch orders for the current page
        const orders = await OrderModel.find({ userId: id })
            .sort({ orderDate: -1 })
            .populate('orderItems.productId')
            .skip((currentPage - 1) * ordersPerPage)
            .limit(ordersPerPage);

        res.render('orderManage', {
            user: userData,
            orders,
            currentPage,
            totalPages
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};



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
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
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
        if (paymentMethod === 'COD' && cart.cartItems.reduce((acc, item) => acc + item.quantity * item.productId.discountPrice, 0) > 1000) {
            return res.status(403).json({ message: "COD only available for orders below ₹1000!" });
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
                productName: product.productName,
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

        await order.save();

        if (paymentMethod === "RazorPay") {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: order.totalAmount * 100,
                currency: "INR",
                receipt: `receipt_order_${order._id}`,
                payment_capture: '1'
            });

            order.razorpayOrderId = razorpayOrder.id;
            await order.save();

            // response
            return res.json({
                success: true,
                message: "Order created and ready for payment.",
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: order.totalAmount * 100,
                key_id: process.env.RAZORPAY_ID_KEY
            });
        } else {
            order.orderStatus = "order confirmed"
            await order.save()

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
        }
    } catch (error) {
        console.error('Create Order Failed:', error);
        next(error);
    }
};

const verifyPayment = async (req, res, next) => {
    const { paymentId, razorpay_order_id, orderId, razorpaySignature } = req.body;

    try {
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // creating signature to verify 
        const data = `${razorpay_order_id}|${paymentId}`;
        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        shasum.update(data);
        const digest = shasum.digest('hex');
        
        if (digest !== razorpaySignature) {
            return res.status(400).json({ success: false, message: "Invalid signature provided" });
        }
        
        order.orderStatus = "order confirmed";
        await order.save();

        const orderData = await OrderModel.aggregate([
            {
                '$match': {
                    '_id': new mongoose.Types.ObjectId(orderId)
                }
            }
        ]);

        for (const product of orderData[0].orderItems) {
            const update = Number(product.quantity);
            await Products.findOneAndUpdate(
                { _id: product.productId },
                {
                    $inc: { inStock: -update },
                    $set: { popularProduct: true }
                }
            );
        }

        res.json({ success: true, message: "Payment verified and order updated" });
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

const getPaymentDetails = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        if (!req.session || !req.session.userId) {
            return res.status(403).json({ message: "User is not authenticated." });
        }

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (order.userId.toString() !== req.session.userId) {
            return res.status(403).json({ success: false, message: "Unauthorized access to the order." });
        }

        const amount = order.totalAmount * 100;

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amount,
            currency: "INR",
            receipt: `receipt_order_${orderId}`,
            payment_capture: '1'
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
            success: true,
            key_id: process.env.RAZORPAY_ID_KEY,
            amount: amount,
            currency: "INR",
            razorpayOrderId: razorpayOrder.id,
            orderId: order._id

        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const adminOrderPageLoad = async (req, res, next) => {
    try {
      const limit = 10; // Number of orders per page
      const page = parseInt(req.query.page) || 1; // Current page number, default to 1 if not specified
  
      // Fetch the orders with pagination
      const orders = await OrderModel.find()
        .sort({ orderDate: -1 }) // Sort by order date, latest first
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('orderItems.productId');
  
      // Fetch total count of orders for pagination calculation
      const totalOrders = await OrderModel.countDocuments();
  
      // Calculate total number of pages
      const totalPages = Math.ceil(totalOrders / limit);
  
      res.render('adminOrderManage', { orders, currentPage: page, totalPages, totalOrders });
    } catch (error) {
      console.log(error.message);
      next(error);
    }
  };
  
  
const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId, newStatus } = req.body;
        const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, { $set: { orderStatus: newStatus } });

        if (updatedOrder) {
            res.json({ success: true, message: "Order status updated successfully" });
        } else {
            res.json({ success: false, message: "Order not found" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server error" });
        next(error)
    }
}

const cancelOrder = async (req, res, next) => {
    try {
        const orderId = req.query.orderId
        const { reason } = req.body;

        // Define the valid reasons for cancellation
        const validReasons = [
            "Product damaged",
            "Product not as described",
            "Shipping delay",
            "Changed my mind",
            "Other"
        ];

        // Validate the reason
        if (!validReasons.includes(reason)) {
            return res.status(400).send({ success: false, message: 'Invalid cancellation reason' });
        }

        const orderData = await OrderModel.findById(orderId);
        console.log(orderId,"order id");
        if (!orderData) {
            return res.status(404).send({ success: false, message: 'Order not found' });
        }

        const update = await OrderModel.findByIdAndUpdate(orderId, { $set: { orderStatus: "cancelled", cancellationReason: reason } });

        const data = await OrderModel.aggregate([
            { '$match': { '_id': new mongoose.Types.ObjectId(orderId) } }
        ]);

        for (const product of data[0].orderItems) {
            const update = Number(product.quantity);
            await Products.findOneAndUpdate(
                { _id: product.productId },
                {
                    $inc: { inStock: update },
                    $set: { popularProduct: true }
                },
            );
        }

        res.status(200).send({ success: true, message: 'Order Cancelled Successfully', reason });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const walletLoad = async (req, res, next) => {
    try {
        const userId = req.session.userId
        if (!userId) {
            return res.status(403).json({ message: "User is not authenticated." });
        }

        const wallet = await Wallet.findOneAndUpdate({ userId: userId }, { $setOnInsert: { userId: userId } }, { new: true, upsert: true })
        const user = await User.findById(userId)

        res.render('wallet', { user, wallet , title: 'Wallet' })

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}




module.exports = {
    ordersPageLoad,
    checkoutPageLoad,
    createOrder,
    adminOrderPageLoad,
    updateOrderStatus,
    cancelOrder,
    verifyPayment,
    getPaymentDetails,
    walletLoad

}