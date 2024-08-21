const mongoose = require('mongoose');

const walletSchema = mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    walletAmount: {
        type: Number,
        default: 0
    },
    productName: {
        type: String,
        default: 0
    },
    productImage: {
        type: String,
        default: 0
    },
    transactionHistory: [{
        amount: {
            type: Number,
            default: 0 
        },
        paymentType: { 
            type: String,
            default: null
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true 
});

module.exports = mongoose.model('Wallet', walletSchema);
