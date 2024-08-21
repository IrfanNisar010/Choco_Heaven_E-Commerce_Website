const Products = require('../models/productModel')
const Brands = require('../models/brandsModel')
const Offer = require('../models/offerModel')

const offerManagementLoad = async (req, res) => {
    try {
        const offers = await Offer.find()
        res.render('offerManage', { offers })
    } catch (error) {
        console.log(error.message);
    }
}

const addOfferLoad = async (req, res, next) => {
    try {
        const brands = await Brands.find({ isDeleted: false });
        const products = await Products.find({ isDeleted: false });

        res.render('addOffer', { brands, products });
    } catch (error) {
        console.error(error.message);
        next(error);
    }
}


const addOffer = async (req, res, next) => {
    try {
        const { offer, offerType, Pname, brands, expireDate, discount, maxRedeemAbelAmount } = req.body

        if (!offer || offer[0] == ' ') {
            return res.status(403).json({ message: "Enter Proper Offer Details" })
        } else if (offerType == '') {
            return res.status(403).json({ message: "Please select any offer type" })
        } else if (!expireDate || !discount || !maxRedeemAbelAmount) {
            return res.status(403).json({ message: "Expire date, discount, and maximum redeemable amount are required" })
        } else {

            let newOffer = new Offer({
                offer: offer,
                offerType: offerType,
                expireDate: expireDate,
                discount: discount,
                maxRedeemAbelAmount: maxRedeemAbelAmount
            })

            if (offerType === 'Product Offer') {
                newOffer.Pname = Pname
                await newOffer.save()
                const offerId = newOffer._id
                await Products.findOneAndUpdate({ productName: Pname }, { $push: { offer: offerId } })
            } else if (offerType === 'Brands Offer') {
                newOffer.brands = brands
                await newOffer.save()
                const offerId = newOffer._id
                await Products.updateMany({ Brands: brands }, { $push: { offer: offerId } })
            }

            res.status(200).json({ success: true })
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const offerStatusChange = async (req, res, next) => {
    try {
        const id = req.query.offerId;
        const offer = await Offer.findById({ _id: id })
        offer.status = !offer.status
        await offer.save()

        if (offer.status) {
            const product = await Products.updateMany({ $or: [{ brands: offer.brands }, { productName: offer.Pname }] }, { $push: { offer: id } })
        } else {
            const product = await Products.updateMany({ $or: [{ brands: offer.brands }, { productName: offer.Pname }] }, { $pull: { offer: id } })
        }

        let message = offer.status ? "Offer Activated successfully" : "Offer Inactivated successfully";

        res.status(200).json({ message })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

module.exports = {
    offerManagementLoad,
    addOfferLoad,
    addOffer,
    offerStatusChange
}