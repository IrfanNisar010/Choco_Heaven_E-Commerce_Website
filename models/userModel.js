const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:false
    },
    googleId: {
        type: String,
        required: false
    },
    is_Verified:{
        type:Boolean,
        required:false,
        default:true
    },
    is_block:{
        type:Boolean,
        default:false
    },
    profilePhoto: {
        type: String,
        required: false
    },
    
},{
    timestamps: true 
})

module.exports=mongoose.model("User",userSchema)