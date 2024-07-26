const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    cartItems: [
        {
            productId: {
                type: mongoose.SchemaTypes.ObjectId,
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
}, {
    timestamps: true 
});

module.exports = mongoose.model('Cart', cartSchema);
