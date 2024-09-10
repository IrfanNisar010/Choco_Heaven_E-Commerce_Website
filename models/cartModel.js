const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'User'
    },
    cartItems: [
        {
            productId: {
                type: mongoose.SchemaTypes.ObjectId,
                required: true,
                ref: 'Products'
            },
            quantity: {
                type: Number,
                default: 1
            },
            price: {
                type: Number,
                required: false
            },
            couponDiscount: { 
                type: Number, 
                default: 0 ,
                required: false
            } 
        }
    ]
}, {
    timestamps: true 
});

module.exports = mongoose.model('Cart', cartSchema);
