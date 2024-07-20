const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const productsLoad = async (req, res, next) => {
    try {

        const currentPage = parseInt(req.query.page) || 1
        const productPerPage = 10
        const skip = (currentPage - 1) * productPerPage;

        const product = await Products.find().skip(skip).limit(productPerPage)

        const totalProduct = await Products.countDocuments()
        const totalPages = Math.ceil(totalProduct / productPerPage)

        res.render('productManage', { product, currentPage, totalPages })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}



const addProductLoad = async (req, res, next) => {
    try {
        const brandsList = await Brands.find({ isDeleted: false });
        res.render('addProducts', { brands: brandsList });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const addProduct = async (req, res, next) => {
    try {

        const images = []

        // Ensure each image field is populated
        if (req.files.productImage1) images.push(req.files.productImage1[0].filename);
        if (req.files.productImage2) images.push(req.files.productImage2[0].filename);
        if (req.files.productImage3) images.push(req.files.productImage3[0].filename);
        if (req.files.productImage4) images.push(req.files.productImage4[0].filename);

        const product = new Products({
            productName: req.body.productName,
            brand: req.body.brandName,
            model: req.body.model,
            size: req.body.size,
            description: req.body.description,
            price: req.body.mrp,
            discountPrice: req.body.discountPrice,
            discount: req.body.discount,
            inStock: req.body.inStock,
            image: images
        })

        await product.save();

        res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const searchProduct = async (req, res, next) => {
    try {
        let productData = []

        const currentPage = parseInt(req.query.page) || 1
        const productPerPage = 10
        const skip = (currentPage - 1) * productPerPage;

        const totalProduct = await Products.countDocuments()
        const totalPages = Math.ceil(totalProduct / productPerPage)

        if (req.query.search && req.query.search.trim() !== "") { 
            productData = await Products.find({ productName: { $regex: req.query.search, $options: 'i' } }).skip(skip).limit(productPerPage)
        } else {
            productData = await Products.find().skip(skip).limit(productPerPage)
        }
        res.render('productManage', { product: productData, currentPage, totalPages })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const listAndUnlistProduct = async (req, res, next) => {
    try {
        const id = req.query.id

        if (!id) return res.status(400).json({ message: 'Product ID is required.' });

        const productData = await Products.findById({ _id: id })
        productData.isDeleted = !productData.isDeleted
        await productData.save()


        let message = productData.isDeleted ? "Product Unlisted successfully" : "Product Listed successfully";

        res.status(200).json({ message })

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const editProductLoad = async (req, res, next) => {
    try {

        const id = req.query.id

        if (!id) return res.redirect('/admin/productManage');

        const product = await Products.findOne({ _id: id })
        const brands = await Brands.find({ isDeleted: false })
        if (product) {
            res.render('editProduct', { product: product, brands: brands })
        } else {
            res.redirect('/admin/productManage')
        }

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const deleteImage = async (req, res, next) => {
    try {
        const { productId, imageIndex } = req.body;

        if (!productId || imageIndex === undefined) return res.status(400).send({ message: 'Product ID and image index are required.' });

        const product = await Products.findById(productId);
        if (product && product.image && product.image.length > imageIndex) {
            product.image.splice(imageIndex, 1);
            await product.save();
            res.status(200).send({ message: 'Image removed successfully' });
        } else {
            res.status(404).send({ message: 'Product or image not found' });
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const editProduct = async (req, res, next) => {
    try {
        // Check if the product ID is provided
        const productId = req.body.id;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' });
        }

        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        let images = [];

        if (req.files) {
            const bodyImages = req.files;
            const fields = ['productImage1', 'productImage2', 'productImage3', 'productImage4'];
            fields.forEach((field, index) => {
                if (bodyImages[field] && bodyImages[field][0]) {
                    images[index] = bodyImages[field][0].filename;
                } else if (product.image[index]) {
                    images[index] = product.image[index];
                }
            });
        }

        const update = await Products.findByIdAndUpdate(productId, {
            productName: req.body.productName,
            brand: req.body.brandName,
            model: req.body.model,
            size: req.body.size,
            description: req.body.description,
            price: req.body.mrp,
            discountPrice: req.body.discountPrice,
            discount: req.body.discount,
            inStock: req.body.inStock,
            image: images
        });

        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


module.exports = {
    productsLoad,
    addProductLoad,
    addProduct,
    searchProduct,
    listAndUnlistProduct,
    editProductLoad,
    deleteImage,
    editProduct
}