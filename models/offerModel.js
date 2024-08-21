const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
    offer: {
        type: String,
        required: true
    },
    offerType: {
        type: String,
        required: true
    },
    Pname: {
        type: String,

    },
    brands: {
        type: String,

    },
    discount: {
        type: Number,
        required: true

    },
    expireDate: {
        type: Date,
        required: true
    },
    maxRedeemAbelAmount: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
},{ timestamps: true }); 

module.exports = mongoose.model('Offer', offerSchema)