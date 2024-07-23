const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Brands'
    },
    model: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discountPrice: {
        type: Number,
        required: false
    },
    discount: {
        type: Number,
        required: false
    },
    image: [{
        type: String,
        required: true
    }],
    status: {
        type: Boolean,
        default: true
    },
    inStock: {
        type: Number,
        required: true
    },
    popularProduct: {
        type: Boolean,
        default: false
    },
    bestSellerProduct: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    offer: [{
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Offer'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Products', productSchema);
