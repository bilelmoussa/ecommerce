const express = require('express');
const router = express.Router();
const multer  = require('multer');
const path = require("path");


const storage = multer.diskStorage({
    destination: "./uploads",
    filename: function(req, file, cb){
       cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
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

router.post('/file',  (req, res, next)=>{
    uploadField(req, res, (err)=>{
        if(err){
            console.log(err);
            res.status(400).json({success: false, error: "Server Error !"});
        }else{
            console.log(req.body);
            if(req.files.length === 0){
                console.log("Error: Empty Files !");
                res.status(400).json({success: false, error: "Empty Files !"});
               }else{
                    console.log(req.files);
                    res.json({success: true, file: req.files});
               }
        }
    })   
});


module.exports = router;
