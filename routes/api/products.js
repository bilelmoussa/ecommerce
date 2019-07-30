const express = require('express');
const router = express.Router();
const passport = require('passport');
const empty = require('../../validation/empty');
const multer  = require('multer');
const path = require("path");
const mongoURI = require('../../config/keys').database;
const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');

//mongoose Product module
const Product = require('../../models/Product');


const storage = new GridFsStorage({
    url: mongoURI,
    options: {useNewUrlParser: true} ,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) {
              return reject(err);
            }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
      });
    });
    }
});


function checkTypeFile(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLocaleLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    }else{
        cb('Error: Images Only !')
    }
}

const uploadField = multer({
    storage: storage,
    limits:{fileSize: 1000000},
    fileFilter: function(req, file, cb){
        checkTypeFile(file, cb);
    }
 }).fields([{ name: 'MyImage', maxCount: 3 }]);

router.post("/AddProduct", (req, res, next)=>{
    uploadField(req, res, (err)=>{
        if(err){
            console.log(err);
            if(err.message){
                return res.status(400).json({success: false, error: err.message})
            }else{
                return res.status(400).json({success: false, error: "Server Error !"})
            }
            
        }else{
            if(
                empty(req.body.ProductName) ||
                empty(req.body.ProductDescription) ||
                empty(req.body.ProductPrice) ||
                empty(req.body.ProductDiscount) ||
                empty(req.body.ProductSize) ||
                empty(req.body.ProductQuantity) ||
                empty(req.body.ProductColors) ||
                empty(req.body.ProductCategories) ||
                empty(req.body.ProductChildCategories) ||
                empty(req.files["MyImage"])
                ){
                    return res.status(404).json({success: false, Error: "Missing Fields !"})
                }

                let size =  JSON.parse(req.body.ProductSize) || [];
                let colors =  JSON.parse(req.body.ProductColors) || [];

                if(!Array.isArray(size)){
                    return res.status(400).json({success: false, Error: "ProductSize must be an Array !"})
                }

                if(!Array.isArray(colors)){
                    return res.status(400).json({success: false, Error: "ProductColors must be an Array !"})
                }

                if(isNaN(req.body.ProductPrice)){
                    return res.status(400).json({success: false, Error: "ProductPrice must be a Number !"})
                }

                if(isNaN(req.body.ProductDiscount)){
                    return res.status(400).json({success: false, Error: "ProductDiscount must be a Number !"})
                }

                if(isNaN(req.body.ProductQuantity)){
                    return res.status(400).json({success: false, Error: "ProductQuantity must be a Number !"})
                }


                let ProductSize = size.map((d)=>{return d.toLocaleLowerCase()});
                let ProductColors = colors.map((d)=>{return d.toLocaleLowerCase()})


                let NewProduct = new Product({
                        ProductName: req.body.ProductName.toLocaleLowerCase(),
                        ProductSize: ProductSize,
                        ProductDescription: req.body.ProductDescription.toLocaleLowerCase(),
                        ProductPrice: req.body.ProductPrice,
                        ProductDiscount: req.body.ProductDiscount,
                        ProductQuantity: req.body.ProductQuantity,
                        ProductColors: ProductColors,
                        ProductCategories:  req.body.ProductCategories.toLocaleLowerCase() || "",
                        ProductChildCategories: req.body.ProductChildCategories.toLocaleLowerCase() || "",
                        ProductFrontImage: req.files["MyImage"][0],
                        ProductLeftSideImage: req.files["MyImage"][1]|| {},
                        ProductRightSideImage: req.files["MyImage"][2] || {},
                })

                NewProduct.save(NewProduct).then((data)=>{
                    return res.status(200).json({success: true, data: data})
                }).catch(err=>{
                    console.log(err);
                    return res.status(400).json({success: false, error: "Server Error  !"})
                })  
        }
    })
})



router.get('/getProduct', (req, res, next)=>{
    let query = {};
    let limit = parseInt(req.query.limit) || 24;
    let skip = parseInt(req.query.skip) || null;
    let sort = req.query.sort || -1;

    if(!empty(req.query.ProductSize)){
        if(req.query.ProductSize.length > 1){
            let size_or = [];
            req.query.ProductSize.forEach((q)=>{
                size_or.push({ProductSize: q})
            })
            query.$or = size_or;
        }else{
            query.ProductSize = req.query.ProductSize[0];
        }
    }

    if(!empty(req.query.ProductCategories)){
        query.ProductCategories = req.query.ProductCategories;
    }

    if(!empty(req.query.ProductChildCategories)){
        query.ProductChildCategories = req.query.ProductChildCategories;
    }

    if(!empty(req.query.ProductColors)){
        if(req.query.ProductColors.length > 1){
            let color_or = [];
            req.query.ProductColors.forEach((q)=>{
                color_or.push({ProductColors: q})
            })
            query.$or = color_or;
        }else{
            query.ProductColors = req.query.ProductColors[0];
        }
    }

    if(!empty(req.query.gtePrice) && empty(req.query.ltePrice)){
        query.ProductPrice = {$gte: parseInt(req.query.gtePrice)};
    }

    if(!empty(req.query.ltePrice) && empty(req.query.gtePrice)){
        query.ProductPrice = {$lte: parseInt(req.query.ltePrice)};
    }

    if(!empty(req.query.ltePrice) && !empty(req.query.gtePrice)){
        query.$and = [{ProductPrice: {$gte:  parseInt(req.query.gtePrice)}}, {ProductPrice: {$lte:  parseInt(req.query.ltePrice)}}]
    }

    if(!empty(req.query.id)){
        query._id = req.query.id
    }

    console.log(query);

    Product.find(query).limit(limit).sort({created_at: sort}).skip(skip)
    .then((data)=>{
        let count = 0;
        if(!data || data.length === 0){
            return res.status(404).json({success: false, Error: "No Product Found !"})
        }
            data.map((d)=>{
                const Ptime = new Date(d.created_at).getTime();
                const TimeNow =  Date.now();
                const ExpTime = TimeNow - Ptime;
                const twoWeek = 1.21e+9;

                if(ExpTime < twoWeek){
                    d.NewProduct = true;
                }else{
                    d.NewProduct = false;
                }

                d.ProductFrontImage.url = `http://localhost:5000/image/${d.ProductFrontImage.filename}`;

                if(d.ProductLeftSideImage){
                    d.ProductLeftSideImage.url = `http://localhost:5000/image/${d.ProductLeftSideImage.filename}`
                }
                if(d.ProductRightSideImage){
                    d.ProductRightSideImage.url = `http://localhost:5000/image/${d.ProductRightSideImage.filename}`
                }
                count ++;
            })
           return res.status(200).json({success: true, data: data, count: count})
    })
    .catch(err =>{
        console.log(err);
        return res.status(400).json({status: false, errror: "Server error !"})
    })
})

router.get("/sizes", (req, res, next)=>{
    let query = {};

    if(!empty(req.query.ProductCategories)){
        query.ProductCategories = req.query.ProductCategories;
    }

    if(!empty(req.query.ProductChildCategories)){
        query.ProductChildCategories = req.query.ProductChildCategories;
    }

    if(!empty(req.query.ProductColors)){
        query.ProductColors = req.query.ProductColors;
    }

    if(!empty(req.query.gtePrice) && empty(req.query.ltePrice)){
        query.ProductPrice = {$gte: parseInt(req.query.gtePrice)};
    }

    if(!empty(req.query.ltePrice) && empty(req.query.gtePrice)){
        query.ProductPrice = {$lte: parseInt(req.query.ltePrice)};
    }

    if(!empty(req.query.ltePrice) && !empty(req.query.gtePrice)){
        query.$and = [{ProductPrice: {$gte:  parseInt(req.query.gtePrice)}}, {ProductPrice: {$lte:  parseInt(req.query.ltePrice)}}]
    }

    Product.find(query)
            .then(data=>{
                if(!data || data.length === 0){
                    return res.status(404).json({success: false, Error: "No Product Found !"})
                }
                let sizes = [];

                data.forEach((d)=>{
                    d.ProductSize.forEach((s)=>{
                        let pos = sizes.map(function(e) { return e.name; }).indexOf(s);
                        if(pos === -1){
                            sizes.push({name: s})
                        }
                    })
                });

                sizes.forEach(size =>{
                    let countSize = 0;
                    data.forEach((d)=>{
                        d.ProductSize.forEach((s)=>{
                           if(size.name == s){
                                countSize++; 
                           }
                        })
                    })
                    size.count = countSize;
                    countSize = 0;
                })
                
                return res.status(200).json({success: true, size: sizes})
            })    
            .catch(err=>{
                console.log(err);
                return res.status(404).json({success: false, error: "Server error !"})
            })  
})

router.get("/colors", (req, res, next)=>{
    let query = {};

    if(!empty(req.query.ProductCategories)){
        query.ProductCategories = req.query.ProductCategories;
    }

    if(!empty(req.query.ProductChildCategories)){
        query.ProductChildCategories = req.query.ProductChildCategories;
    }
    
    if(!empty(req.query.ProductSize)){
        query.ProductSize = req.query.ProductSize;
    }

    if(!empty(req.query.gtePrice) && empty(req.query.ltePrice)){
        query.ProductPrice = {$gte: parseInt(req.query.gtePrice)};
    }

    if(!empty(req.query.ltePrice) && empty(req.query.gtePrice)){
        query.ProductPrice = {$lte: parseInt(req.query.ltePrice)};
    }

    if(!empty(req.query.ltePrice) && !empty(req.query.gtePrice)){
        query.$and = [{ProductPrice: {$gte:  parseInt(req.query.gtePrice)}}, {ProductPrice: {$lte:  parseInt(req.query.ltePrice)}}]
    }

    Product.find(query)
            .then(data=>{
                if(!data || data.length === 0){
                    return res.status(404).json({success: false, Error: "No Product Found !"})
                }
                let colors = [];

                data.forEach((d)=>{
                    d.ProductColors.forEach((c)=>{
                        let pos = colors.map(function(e) { return e.name; }).indexOf(c);
                        if(pos === -1){
                            colors.push({name: c})
                        }
                    })
                });

                colors.forEach(color =>{
                    let countColor = 0;
                    data.forEach((d)=>{
                        d.ProductColors.forEach((c)=>{
                           if(color.name == c){
                                countColor++; 
                           }
                        })
                    })
                    color.count = countColor;
                    countColor = 0;
                })
                

                return res.status(200).json({success: true, colors: colors})
            })    
            .catch(err=>{
                console.log(err);
                return res.status(404).json({success: false, error: "Server error !"})
            })  
})

module.exports = router;
