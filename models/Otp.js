const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    otp: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 60 // expires in 60 seconds (1 minute)
    }
});

module.exports = mongoose.model('OTP', otpSchema);
