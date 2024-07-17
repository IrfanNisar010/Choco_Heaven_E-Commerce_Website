const { name } = require('ejs');
const Brands = require('../models/brandsModel');
const mongoose = require('mongoose');

const BrandsPageLoad = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const brandsPerPage = 8;
        const skip = (currentPage - 1) * brandsPerPage;

        const brands = await Brands.find().skip(skip).limit(brandsPerPage);

        const totalBrands = await Brands.countDocuments();
        const totalPages = Math.ceil(totalBrands / brandsPerPage);

        res.render('brandsManage', { brands, currentPage, totalPages });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const addBrandPageLoad = async (req, res, next) => {
    try {
        res.render('addBrands');
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const addBrands = async (req, res, next) => {
    try {
      const { brandName, description, isAvailable } = req.body;
      const image = req.file;
      // Log the received data

      if(!image ){
        return res.send("fjashfkjafkjh")
      }
      console.log("Received data:", { brandName, description, isAvailable, image });
  
      if (!brandName || !description || !image) {
        console.log("Missing fields:", { brandName, description, image });
        return res.status(403).json({ message: "Please enter all brand details including an image!" });
      }
  
      if (brandName.trim() === '' || description.trim() === '') {
        console.log("Invalid fields:", { brandName, description });
        return res.status(403).json({ message: "Please enter valid brand details!" });
      }
  
      const brandsName = brandName.toLowerCase();
      const brandsData = await Brands.findOne({ name: brandsName });
  
      if (brandsData) {
        console.log("Brand already exists:", brandsData);
        return res.status(403).json({ message: "This brand is already added!" });
      }
  
      const imagePath = image ? image.filename : '';
  
      const newBrand = new Brands({
        name: brandsName,
        description,
        status: !!isAvailable,
        imageUrl: imagePath
      });
  
      await newBrand.save();
      res.status(200).json({ success: true });
    } catch (error) {
      console.log("Error in addBrands:", error.message);
      next(error);
    }
  };
  

const searchBrands = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const brandsPerPage = 8;
        const skip = (currentPage - 1) * brandsPerPage;

        const totalBrands = await Brands.countDocuments();
        const totalPages = Math.ceil(totalBrands / brandsPerPage);

        let brands = [];
        if (req.query.search) {
            brands = await Brands.find({ name: { $regex: req.query.search, $options: 'i' } }).skip(skip).limit(brandsPerPage);
        } else {
            brands = await Brands.find().skip(skip).limit(brandsPerPage);
        }

        res.render('brandsManage', { brands, currentPage, totalPages });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const softDeleteBrands = async (req, res, next) => {
    try {
        const id = req.query.brandId;
        if (id) {
            await Brands.findByIdAndUpdate(id, { isDeleted: true });
            return res.redirect('/admin/brandsManage');
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const editBrandsLoad = async (req, res, next) => {
    try {
        const id = req.query.brandId;
        const brand = await Brands.findById(id);

        if (brand) {
            res.render('editBrands', { brand });
        } else {
            res.redirect('/admin/brandsManage');
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const editBrands = async (req, res, next) => {
    try {
        const { id, brandName, description, isAvailable } = req.body;
        const objectId = new mongoose.Types.ObjectId(id);

        const brandsName = brandName.toLowerCase();

        const isBrandExists = await Brands.aggregate([{ $match: { _id: { $ne: objectId }, name: brandsName } }]);

        if (isBrandExists.length > 0) {
            return res.status(403).json({ message: "This brand is already added!" });
        }

        if (brandName.trim() === '' || description.trim() === '') {
            return res.status(403).json({ message: "Please enter brand details!" });
        }

        const image = req.file;
        let imagePath = '';

        if (image) {
            imagePath = image.filename;
        } else {
            const existingBrand = await Brands.findById(id);
            imagePath = existingBrand.imageUrl;
        }

        await Brands.findByIdAndUpdate(id, {
            $set: {
                name: brandsName,
                description,
                status: !!isAvailable,
                imageUrl: imagePath
            }
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const restoreBrands = async (req, res, next) => {
    try {
        const id = req.query.id;
        if (id) {
            await Brands.findByIdAndUpdate(id, { isDeleted: false });
            return res.redirect('/admin/brandsManage');
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

module.exports = {
    BrandsPageLoad,
    addBrandPageLoad,
    addBrands,
    searchBrands,
    softDeleteBrands,
    editBrandsLoad,
    editBrands,
    restoreBrands
};
