const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true 
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  website: {
    type: String 
  },
  isDeleted: { 
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Brands = mongoose.model('Brands', BrandSchema);

module.exports = Brands;
