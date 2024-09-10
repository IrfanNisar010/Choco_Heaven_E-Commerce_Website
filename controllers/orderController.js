const User = require('../models/userModel')
const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const OrderModel = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Wallet  = require('../models/walletModel')
const Razorpay = require('razorpay')
const crypto  = require('crypto')
const Offer = require('../models/offerModel');
const puppeter = require('puppeteer')
const { default: mongoose } = require('mongoose');
const PDFDocument = require('pdfkit');
const { render } = require('ejs')
const { log } = require('console')

// RazorPay instance 
var razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

const getOrderStatus = async(req, res, next) => {
    try {
        const { orderId } = req.query;
        const order = await OrderModel.findById(orderId).select('orderStatus');

        if (order) {
            res.json({ success: true, status: order.orderStatus });
        } else {
            res.json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.json({ success: false, message: 'An error occurred while fetching the order status.' });
    }
}
const ordersPageLoad = async (req, res, next) => {
    try {
        const id = req.session.userId;
        const userData = await User.findById(id);

        const ordersPerPage = 3;
        const currentPage = parseInt(req.query.page) || 1;

        const totalOrders = await OrderModel.countDocuments({ userId: id });
        const totalPages = Math.ceil(totalOrders / ordersPerPage);

        const orders = await OrderModel.find({ userId: id })
            .sort({ orderDate: -1 }) // Sort by latest first
            .populate('orderItems.productId')
            .skip((currentPage - 1) * ordersPerPage)
            .limit(ordersPerPage);

        // Enhancing the orders with the total discount calculation
        const enhancedOrders = orders.map(order => {
            let totalDiscount = 0;

            // Summing up the discount from each order item
            order.orderItems.forEach(item => {
                totalDiscount += item.discount || 0;
            });

            return {
                ...order._doc, // Spread the order document
                totalDiscount  // Add total discount to the order object
            };
        });

        res.render('orderManage', {
            user: userData,
            orders: enhancedOrders,
            currentPage,
            totalPages,
            totalOrders,
            ordersPerPage
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const orderDetailsLoad = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;

        const userData = await User.findById(userId);
        const order = await OrderModel.findById(orderId); 

        if (!order) {
            console.log(`Order not found for orderId: ${orderId}`);
            return res.status(404).render('trackOrder', { user: userData, order: null });
        }


        res.render('trackOrder', { user: userData, order });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};



const checkoutPageLoad = async (req, res, next) => {
    try {
        const id = req.session.userId;
        const productId = req.query.productId;

        const userData = await User.findById({ _id: id });
        const userAddress = await Address.find({ user_id: id });
        let productData = [];
        let totalPrice = 0;
        let productPrice = 0;

        if (productId) {
            let product = await Products.findById(productId);
            product = product.toObject();
            product.productId = product._id;
            productPrice = product.price; // Store original product price
            productData.push(product);
            totalPrice = product.discountPrice; // Start with discount price

            if (product.offer.length > 0) {
                const offerIndex = product.offer.length - 1;
                const offerId = product.offer[offerIndex];
                const offer = await Offer.findById(offerId);
                totalPrice = totalPrice - (totalPrice * offer.discount) / 100;

                if (totalPrice > offer.maxRedeemAbelAmount) {
                    totalPrice = offer.maxRedeemAbelAmount;
                }

                req.session.offerId = offer._id;
            }

            let couponDiscount = 0;
            let couponCode = null;
            req.session.product = productData;
            if (req.session.coupon && req.session.couponId) {
                const coupon = await Coupon.findById(req.session.couponId);
                const discountPercentage = req.session.coupon;
                const maxDiscount = coupon.maxRedeemAbelAmount;

                let discount = (totalPrice * discountPercentage) / 100;

                if (discount > maxDiscount) {
                    discount = maxDiscount;
                }

                couponDiscount = discount;
                couponCode = coupon.couponCode;
                req.session.totalAmount = totalPrice + 60 - discount;
            } else {
                req.session.totalAmount = totalPrice + 60;
            }
            res.render('checkout', { user: userData, userAddress, productData, totalPrice, productPrice, couponDiscount, couponCode});

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

            productData = await Promise.all(products.map(async (item) => {
                let productPrice = item.product.price; // Store original product price
                let discountPrice = item.product.discountPrice;
                let extendedPrice = discountPrice * item.quantity;

                if (item.product.offer && item.product.offer.length > 0) {
                    const offerIndex = item.product.offer.length - 1;
                    const offerId = item.product.offer[offerIndex];
                    const offer = await Offer.findById(offerId);
                    discountPrice -= (discountPrice * offer.discount) / 100;
                    if (discountPrice > offer.maxRedeemAbelAmount) {
                        discountPrice = offer.maxRedeemAbelAmount;
                    }

                    extendedPrice = discountPrice * item.quantity;
                }

                totalPrice += extendedPrice;
                return {
                    productId: item.product._id,
                    productName: item.product.productName,
                    discountPrice: discountPrice,
                    productPrice: productPrice,
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
            }));

            let couponDiscount = 0;
            let couponCode = null;
            req.session.product = productData;
            if (req.session.coupon && req.session.couponId) {
                const coupon = await Coupon.findById(req.session.couponId);
                const discountPercentage = req.session.coupon;
                const maxDiscount = coupon.maxRedeemAbelAmount;

                let discount = (totalPrice * discountPercentage) / 100;

                if (discount > maxDiscount) {
                    discount = maxDiscount;
                }

                couponDiscount = discount;
                couponCode = coupon.couponCode;
                req.session.totalAmount = totalPrice + 40 - discount;
            } else {
                req.session.totalAmount = totalPrice + 40;
            }
            res.render('checkout', { user: userData, userAddress, productData, totalPrice, productPrice, couponDiscount, couponCode});
        }

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const createOrder = async (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(403).json({ message: "User is not authenticated." });
        }

        const userId = req.session.userId;
        const { addressId, paymentMethod , couponCode } = req.body;

        const userData = await User.findById(userId);
        const wallet = await Wallet.findOneAndUpdate(
            { userId: userId },
            { $setOnInsert: { userId: userId } },
            { new: true, upsert: true }
        );

        const userAddress = await Address.findById(addressId);
        if (!userAddress) {
            return res.status(404).json({ message: "Address not found." });
        }

        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        if (!cart || cart.cartItems.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }

       
        const products = req.session.product;

        for (let product of products) {
            if (product.inStock <= 0) {
                req.session.message = "Product is Out of Stock!!";
                return res.redirect('/checkout');
            }
        }
        
        if (paymentMethod === 'COD' && cartTotal > 1000) {
            req.session.message = "COD is only available for orders below ₹1000!";
            return res.redirect('/checkout');
        }
        
        if (paymentMethod === 'Wallet' && wallet.walletAmount < req.session.totalAmount) {
            req.session.message = "Uh-oh, your wallet's on a diet!";
            return res.redirect('/checkout');
        }

        const orderItems = cart.cartItems.map(item => {
            const product = item.productId;
            
            // Get the last offer ID from the product's offer array, if available
            const offerId = product.offer && product.offer.length > 0 ? product.offer[product.offer.length - 1] : null;
        
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
                image: product.image,
                offerId: offerId 
            };
        });
        

        const order = new OrderModel({
            userId: userId,
            orderItems: orderItems,
            totalAmount: req.session.totalAmount, 
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
            couponCode: couponCode || null,
            orderStatus: paymentMethod === 'COD' ? "Order confirmed" : "pending"
        });

        if (req.session.coupon && req.session.couponId) {
            order.couponId = req.session.couponId
        }
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

            // Clear the cart after saving the Razorpay order ID
            await Cart.findOneAndDelete({ userId: userId });

            // Response
            return res.json({
                success: true,
                message: "Order created and ready for payment.",
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: order.totalAmount * 100,
                key_id: process.env.RAZORPAY_ID_KEY
            });
        } else {
            order.orderStatus = "order confirmed";
            await order.save();

              // wallet changes >>
              if (paymentMethod === 'Wallet') {
                await Wallet.findOneAndUpdate(
                    { userId: userId },
                    {
                        $inc: { walletAmount: -order.totalAmount },
                        $push: {
                            transactionHistory: {
                                amount: order.totalAmount,
                                PaymentType: "Debit",
                                date: new Date()
                            }
                        }
                    },
                    { new: true, upsert: true })
            }


        }
        const orderId = order._id
        const data = await OrderModel.aggregate(
            [
                {
                    '$match': {
                        '_id': new mongoose.Types.ObjectId(orderId)
                    }
                }
            ]
        )
        for (const product of data[0].orderItems) {

            const update = Number(product.quantity);
            await Products.findOneAndUpdate(
                { _id: product.productId },
                {
                    $inc: { inStock: -update },
                    $set: { popularProduct: true }
                },
            )

        }

        // Update stock for each product
        for (let item of cart.cartItems) {
            await Products.findByIdAndUpdate(item.productId, {
                $inc: { inStock: -item.quantity },
                $set: { popularProduct: true }
            });
        }

        // Clear the cart after order is placed
        await Cart.findOneAndDelete({ userId: userId });

        if (!userAddress || !paymentMethod) {
            return res.render('checkout', {
                warning: "Please select both address and payment method before placing the order.",
            });
        }

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

const downloadInvoice = async (req, res, next) => {
    try {
        const invoiceNumber = generateInvoiceNumber();
        const orderId = req.query.orderId;
        const order = await OrderModel.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_Choco_Heaven.pdf"`);
        doc.pipe(res);

        // Add fonts (ensure paths are correct)
        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text('Choco Heaven', { align: 'center' })
            .moveDown();

        doc.font('Helvetica-Bold')
            .fontSize(15)
            .text('INVOICE', { align: 'center' })
            .moveDown();

        doc.font('Helvetica-Bold')
            .fontSize(8)
            .text(`Invoice Number: ${invoiceNumber}`, { align: 'left' })
            .text(`Order Date: ${order.orderDate.toDateString()}`, { align: 'left' })
            .moveDown()
            .text(`Order ID: ${order._id}`, { align: 'left' })
            .text(`Product ID: ${order.orderItems[0]?.productId || 'N/A'}`, { align: 'left' })
            .moveDown();

        // Address section
        doc.fontSize(12).text('Address');
        doc.fontSize(10).text(`Name: ${order.address.Name}`);
        doc.text(`Address: ${order.address.address}, ${order.address.city}, ${order.address.PIN}`).moveDown();

        // Table headers
        const tableHeaders = ['Product Name', 'Quantity', 'Unit Price'];
        const startX = 50;
        const startY = doc.y + 15;
        const cellWidth = 120;
        const headerHeight = 30;

        doc.rect(startX, startY, cellWidth * tableHeaders.length, headerHeight).fillAndStroke('#CCCCCC', '#000000');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
        tableHeaders.forEach((header, index) => {
            doc.text(header, startX + (cellWidth * index) + 10, startY + 10, { width: cellWidth, align: 'left' });
        });

        // Table rows
        const rowHeight = 25;
        let yPos = startY + headerHeight;
        let totalPrice = 0;

        order.orderItems.forEach((item, rowIndex) => {
            const fillColor = rowIndex % 2 === 0 ? '#FAF9F6' : '#EEEEEE';
            doc.rect(startX, yPos, cellWidth * tableHeaders.length, rowHeight).fillAndStroke(fillColor, '#000000');
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
            doc.text(item.productName || 'N/A', startX + 10, yPos + 5, { width: cellWidth, align: 'left' });
            doc.text(item.quantity.toString(), startX + cellWidth + 10, yPos + 5, { width: cellWidth, align: 'left' });
            doc.text(item.price !== undefined ? item.price.toFixed(2) : 'N/A', startX + (cellWidth * 2) + 10, yPos + 5, { width: cellWidth, align: 'left' });

            const itemTotalPrice = item.price !== undefined && item.quantity !== undefined ? item.price * item.quantity : 0;
            totalPrice += itemTotalPrice;
            yPos += rowHeight;
        });

        // Calculate discount
        const discount = totalPrice - order.totalAmount;

        // Total and discount
        yPos += 10;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text(`Total Amount: ${order.totalAmount.toFixed(2)}`, startX, yPos);
        doc.text(`Discount: ${discount.toFixed(2)}`, startX + 200, yPos);
        doc.end();
    } catch (error) {
        console.log(error.message);
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

        res.json({ success: true, message: "Payment verified and order updated" , orderId:order.id});
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
      const limit = 10; 
      const page = parseInt(req.query.page) || 1; 
  
      const orders = await OrderModel.find()
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('orderItems.productId');
  
      // Fetch total count of orders for pagination calculation
      const totalOrders = await OrderModel.countDocuments();
  
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
        const orderid = req.query.orderId
        const orderData = await OrderModel.findById(orderid)
        const update = await OrderModel.findByIdAndUpdate(orderid, { $set: { orderStatus: "cancelled" } })

        const data = await OrderModel.aggregate(
            [
                {
                    '$match': {
                        '_id': new mongoose.Types.ObjectId(orderid)
                    }
                }
            ]
        )
        for (const product of data[0].orderItems) {

            const update = Number(product.quantity);
            await Products.findOneAndUpdate(
                { _id: product.productId },
                {
                    $inc: { inStock: update },
                    $set: { popularProduct: true }
                },
            )

        }

        if (orderData.paymentMethod === 'RazorPay'|| orderData.paymentMethod === 'COD' || orderData.paymentMethod === 'Wallet') {
            await Wallet.findOneAndUpdate(
                { userId: req.session.userId },
                {
                    $inc: { walletAmount: orderData.totalAmount },
                    $push: {
                        transactionHistory: {
                            amount: orderData.totalAmount,
                            paymentType: "credit",
                            date: new Date()
                        }
                    }
                },
                { new: true, upsert: true })
        }

        res.status(200).send({ message: 'Order Cancelled Successfully' });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const requestForReturn = async (req, res, next) => {
    try {
        const { orderId, reason } = req.body;

        const order = await OrderModel.findByIdAndUpdate(orderId,
            { $set: { returnReason: reason, orderStatus: 'Requested for Return' } })

        if (!order) {
            return res.status(404).send({
                message: "Order not found."
            });
        }

        res.status(200).send({
            message: "Return processed successfully.",
            order: order
        });
    } catch (error) {
        console.log(error.message);
        next(error)

    }
}

const approveReturn = async (req, res, next) => {
    try {
        const orderId = req.query.orderId;

        const order = await OrderModel.findByIdAndUpdate(orderId,
            { $set: { orderStatus: 'returned' } })

        if (!order) {
            return res.status(404).send({
                message: "Order not found."
            });
        }

        // add to wallet
        const orderData = await OrderModel.findById(orderId)
        await Wallet.findOneAndUpdate(
            { userId: orderData.userId },
            {
                $inc: { walletAmount: orderData.totalAmount },
                $push: {
                    transactionHistory: {
                        amount: orderData.totalAmount,
                        PaymentType: "credit",
                        date: new Date()
                    }
                }
            },
            { new: true, upsert: true })

        res.status(200).send({
            message: "Return Approved successfully.",
            order: order
        });
    } catch (error) {
        console.log(error.message);
        next(error)

    }
}

function generateInvoiceNumber() {
    return Math.floor(Math.random() * 1000000) + 1;
}


const walletLoad = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(403).json({ message: "User is not authenticated." });
        }

        const { page = 1, limit = 8 } = req.query; // Default to page 1, 5 transactions per page

        const wallet = await Wallet.findOneAndUpdate(
            { userId: userId },
            { $setOnInsert: { userId: userId } },
            { new: true, upsert: true }
        );

        const totalTransactions = wallet.transactionHistory.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        const paginatedTransactions = wallet.transactionHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, latest first
            .slice((page - 1) * limit, page * limit); // Paginate transactions

        const user = await User.findById(userId);

        res.render('wallet', {
            user,
            wallet: { ...wallet._doc, transactionHistory: paginatedTransactions },
            currentPage: parseInt(page),
            totalPages,
            limit,  // Pass limit to the view
            title: 'Wallet'
        });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};




module.exports = {
    ordersPageLoad,
    orderDetailsLoad,
    checkoutPageLoad,
    createOrder,
    adminOrderPageLoad,
    updateOrderStatus,
    cancelOrder,
    verifyPayment,
    getOrderStatus,
    getPaymentDetails,
    requestForReturn,
    approveReturn,
    downloadInvoice,
    walletLoad

}