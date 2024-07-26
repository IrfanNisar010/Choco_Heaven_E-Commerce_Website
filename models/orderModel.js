const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    userId :{
        type : mongoose.SchemaTypes.ObjectId,
        required : true
    },
    orderItems :[{
        productId : {
            type:mongoose.SchemaTypes.ObjectId,
            required:true
        },
        quantity: {
            type: Number,
            required: true,
            default : 1
        },
        productName :{
            type:String,
            requred:true
        },
        brandId:{
            type:String,
            requred:true
        },
        model:{
            type:String,
            requred:true
        },
        description:{
            type:String,
            requred:true
        },
        price:{
            type:Number,
            requred:true
        },
        discountPrice:{
            type:Number,
            requred:true
        },
        discount:{
            type:Number,
            requred:true
        },
        image:[{
            type:String,
            requred:true
        }]
        
    }],
    paymentMethod :{
        type:String,
        required:true
    },
    orderDate: {
        type:Date,
        default:Date.now()
    },
    address : {
        Name : {
            type:String,
            required:true
        },
        email :{
            type:String,
            required:true
        },
        Mobile : {
            type:Number,
            required:true
        },
        PIN : {
            type:Number,
            required:true
        },
        street : {
            type:String,
            required:true
        },
        address : {
            type:String,
            required:true
        },
        city : {
            type:String,
            required:true
        },
        state : {
            type:String,
            required:true
        },
        country : {
            type:String,
        },
        landmark : {
            type:String,
        },
        is_Home : {
            type:Boolean,
            default:false
        },
        is_Work : {
            type:Boolean,
            default:false
        },
    },
    orderStatus: {
        type: String,
        default: "pending",
        required: true
    },
    returnReason: {
        type: String,
    },
    cancelReason: {
        type: String,
    },
    totalAmount: {
        type: Number
    },
    
})

module.exports = mongoose.model('Order',orderSchema)