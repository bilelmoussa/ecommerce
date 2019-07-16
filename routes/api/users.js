const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require("../../config/keys");


// mongoose user module 
const User = require('../../models/user');

//empty validation
const isEmpty = require('../../validation/empty');

// register
router.post("/register", (req, res, next)=>{    
    let user_name = req.body.user_name;
    let password = req.body.password;
	
    User.getUserByUsername(user_name, (err, user)=>{
        if(err){
            console.log('Error : ', err);
            return res.status(400).json({success: false, msg: "error !"})
        }
        else if(user){
            return res.status(400).json({success: false, msg: "user already exist ! please change username"});
        }
        else if(!/^[a-z0-9]+$/i.test(password) || password.length < 8 || !password){
            return res.status(400).json({success: false, msg: "password must be at leaset 8 characters and contain only alphanumeric"})
        }
        else{
            let newUser = new User({
                name: req.body.name,
                user_name: req.body.user_name,
                password: req.body.password,
            });
    
            User.addUser(newUser, (err, user)=>{
                if(err){
                    console.log(`Error: `, err);
                    res.status(400).json({success: false, msg:"server error !", err:err.message})
                }else{
                    res.json({success: true, msg:'Regsitered with success', user_id: user._id})
                };
            });
        }
    })
});

//log
router.post("/login", (req, res, next)=>{
    
    const user_name = req.body.user_name;
    const password = req.body.password;

    if(isEmpty(user_name) || isEmpty(password)){
        return res.status(400).json({success: false, error: "Empty Fields !"})
    }else{

    User.getUserByUsername(user_name, (err, user)=>{
        if(err){
            console.log(`Error: `, err);
            return res.status(400).json({success: false, msg: err});
        }else if(!user){
            return res.status(404).json({success: false, msg: 'user not found'});
        }else{

        User.camparePassword(password, user.password, (err, isMatch) => {
            if(err){
                console.log(`Error: `, err);
                return res.status(400).json({success: false, msg:err.message})
            }else{
            if(isMatch){
					let user_token = {
						_id: user._id,
						user_name: user.user_name,
						name: user.name,
						role: user.role,
					}
                    const token = jwt.sign(user_token, config.secret, {
                    expiresIn: 90000, 
                  });
               return res.json({
                    success: true,
                    token: 'bearer ' +token,
                    user: {
						userId: user.id,
                        user_name: user.user_name,
						userRole: user.role,
                    } 
                })   
            }else{
                return res.status(400).json({success: false, msg: 'wrong password'});
            }
        }
        });
    }     
    })
    }
});

router.post('/profile', (req, res, next)=>{
    passport.authenticate('jwt', {session: false}, function(err, user){
        if (err) { return next(err); }
        if (!user) { return res.status(404).json('Unauthorised'); }
        else{
            console.log(user);
            let user_name = req.body.user_name;
            User.findOne(user_name)
            .then(user =>{
                return res.status(200).json({success: true, 
                user_data:{user_name: user.user_name,
                            id: user._id,
                            full_name : user.full_name,
                            role: user.role,
                            created_at: user.created_at
                }
            })}).catch(err =>{console.log(err); return res.status(400).json({errors: "Server Error !"})})
        }
    })(req, res, next)
})

module.exports = router;
