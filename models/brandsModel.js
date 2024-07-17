const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensure each brand name is unique
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String, // You can store the URL or path to the logo image
    required: true
  },
  website: {
    type: String // If the brand has a website, you can store it here
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Brands = mongoose.model('Brands', BrandSchema);

module.exports = Brands;
