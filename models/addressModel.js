const mongoose = require ('mongoose')

const addressSchema = mongoose.Schema({
    user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required:true
    },
    name : {
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
        required:true
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
     
})

module.exports = mongoose.model('Address', addressSchema)