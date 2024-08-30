const User = require('../models/userModel');
const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Orders = require('../models/orderModel')

const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table')
const ExcelJS = require('exceljs');
const fs = require('fs')

const loginLoad = async (req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message);
    }
};

const verifyLogin = async (req, res) => {
    try {
        const isUser = req.body;
        const email = process.env.AUTH_ADMIN_EMAIL;
        const password = process.env.AUTH_ADMIN_PASSWORD;

        if (isUser.email === email) {
            if (isUser.password === password) {
                req.session.admin = { email: isUser.email }
                res.redirect('/admin/dashboard');
            } else {
                return res.render('adminLogin', { message: "Please enter a valid User Name and Password" });
            }
        } else {
            return res.render('adminLogin', { message: "Please enter a valid User Name and Password" });
        }

    } catch (error) {
        console.log(error.message);
    }
};

const loadHome = async (req, res) => {
    try {
        const page = req.query.page || 1; // Get current page from query or default to 1
        const limit = 10; // Define how many orders to display per page

        // Get the count of users, products, and orders
        const userCount = await User.find().countDocuments();
        const productCount = await Products.find().countDocuments();
        const orderCount = await Orders.find().countDocuments();

        // Calculate total sales
        const result = await Orders.aggregate([
            { $match: { orderStatus: "completed" } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);
        const totalSales = result.length > 0 ? result[0].totalSales : 0;

        // Get the count of returned orders
        const returnedOrderCount = await Orders.find({ orderStatus: "returned" }).countDocuments();

        const topProduct = await Orders.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.productName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topBrand = await Orders.aggregate([{ $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.brandId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }
            ]);

        // Fetch paginated order details
        const orders = await Orders.find()
            .sort({ orderDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('orderItems.productId');

        // Render the dashboard with all the gathered data, including paginated order details
        res.render('dashboard', {
            userCount,
            productCount,
            orderCount,
            totalSales,
            returnedOrderCount,
            orders, 
            topBrand,
            topProduct,
            currentPage: page,
            totalPages: Math.ceil(orderCount / limit) // Calculate total pages for pagination
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error"); // Added error handling for response
    }
};



const loadUserManagement = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const userPerPage = 10;
        const skip = (currentPage - 1) * userPerPage;

        const users = await User.find().skip(skip).limit(userPerPage);

        const totalProduct = await User.countDocuments();
        const totalPages = Math.ceil(totalProduct / userPerPage);

        res.render('userManagement', { users, currentPage, totalPages });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const blockAndUnblockUser = async (req, res, next) => {
    try {
        const userId = req.query.id;
        const userData = await User.findById(userId);
        
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        userData.is_block = !userData.is_block;
        await userData.save();

        let message = userData.is_block ? "User Blocked successfully" : "User Unblocked successfully";
        res.status(200).json({ message });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const searchUser = async (req, res, next) => {
    try {
        let users = [];
        const currentPage = parseInt(req.query.page)
        const userPerPage = 10
        const skip = (currentPage - 1) * userPerPage;

        const totalProduct = await User.countDocuments()
        const totalPages = Math.ceil(totalProduct / userPerPage)


        if (req.query.search) {

            users = await User.find({ firstName: { $regex: req.query.search, $options: 'i' } }).skip(skip).limit(userPerPage)
        } else {
            users = await User.find().skip(skip).limit(userPerPage)
        }
        res.render('userManagement', { users: users, currentPage, totalPages })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const orderStatuses = async (req, res, next) => {
    try {
        const orderCounts = await Orders.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        const dailyOrders = await Orders.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                    count: { $sum: 1 }
                }
            }, { $sort: { "_id": 1 } }
        ]);

        const topBrands = await Orders.aggregate([{ $unwind: "$orderItems" },
        { $group: { _id: '$orderItems.brands', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }
        ]);

        res.json({ status: orderCounts, perDay: dailyOrders, brands: topBrands});

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}
const salesReport = async (req, res, next) => {
    try {
        const { interval, startDate, endDate, page = 1, limit = 10 } = req.query;
        const query = {};

        if (interval === 'daily') {
            query.orderDate = {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            };
        } else if (interval === 'weekly') {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            query.orderDate = {
                $gte: startDate,
                $lt: endDate
            };
        } else if (interval === 'yearly') {
            const yearStart = new Date(new Date().getFullYear(), 0, 1);
            const yearEnd = new Date(new Date().getFullYear() + 1, 0, 0);
            query.orderDate = {
                $gte: yearStart,
                $lt: yearEnd
            };
        } else if (startDate && endDate) {
            query.orderDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const salesReport = await Orders.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalOrders = await Orders.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        // Convert _id and brandId to string and ensure productName is defined before sending to the frontend
        const salesReportWithStringIds = salesReport.map(order => ({
            ...order.toObject(),
            _id: order._id.toString(),
            orderItems: order.orderItems.map(item => ({
                ...item,
                brandId: item.brandId.toString(),
                productName: item.productName || 'N/A' // Default to 'N/A' if productName is undefined
            }))
        }));

        res.render('salesReport', { salesReport: salesReportWithStringIds, totalPages, currentPage: parseInt(page) });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};
const downloadExcel = async (req, res) => {
    try {
        const { data } = req.body;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Data');

        worksheet.columns = [
            { header: 'Order Id', key: 'orderId', width: 20 },
            { header: 'Order Date', key: 'orderDate', width: 20 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Product Name', key: 'productName', width: 20 },
            { header: 'Brands', key: 'brands', width: 20 }, 
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
        ];

        worksheet.addRows(data);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="salesReport.xlsx"');

        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).send('Error generating Excel file');
    }
}


const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loginLoad,
    verifyLogin,
    loadHome,
    loadUserManagement,
    blockAndUnblockUser,
    searchUser,
    orderStatuses,
    salesReport,
    downloadExcel,
    logout
};
