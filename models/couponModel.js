const mongoose = require('mongoose')

const couponSchema = mongoose.Schema({
    couponName :{  
        type:String,
        required:true
      },
    couponCode :{  
        type:String,
        required:true,
        unique:true
      },
      status:{
        type:Boolean,
        default:true
      },
      discountPercentage:{
        type:Number,
        required:true
      },
      expiredDate:{
        type: Date,
        required: true,
      },
      createdDate:{
        type: Date,
        required: true,
        default:Date.now()
      },
      minPurchaseAmt:{
        type:Number,
        required:true
      },
      maxRedeemAbelAmount:{
        type:Number,
        required:true
      },
      description :{  
        type:String,
        required:true
      },
})

module.exports = mongoose.model('Coupon',couponSchema)