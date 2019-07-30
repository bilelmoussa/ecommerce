const mongoose = require('mongoose');
const Joigoose = require('joigoose')(mongoose);
const Joi = require('joi');

const schema = mongoose.Schema;

let options = Joi.object({
    ProductName: Joi.string().lowercase().trim().lowercase().required(),
    ProductDescription: Joi.string().lowercase().trim().required(),
    ProductPrice: Joi.number().required(),
    ProductDiscount: Joi.number().required(),
    ProductQuantity: Joi.number().required(),
    ProductColors: Joi.array().required(),
    ProductSize: Joi.array().required(),
    ProductCategories: Joi.string().lowercase().valid('men','women', 'kids').required(),
    ProductChildCategories: Joi.string().lowercase().valid('clothing', 'shoes', 'accessories').required(),
    ProductFrontImage: Joi.object().required(),
    ProductLeftSideImage: Joi.object(),
    ProductRightSideImage: Joi.object(),
    NewProduct : Joi.boolean(),
    created_at: Joi.date().default(Date.now()).required(),
    update_at: Joi.date().default(Date.now()).required()
});


//create Schema
const productSchema = new schema(Joigoose.convert(options));

module.exports = Product = mongoose.model('Product', productSchema);