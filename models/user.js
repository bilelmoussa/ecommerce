const mongoose = require('mongoose');
const Joigoose = require('joigoose')(mongoose);
const Joi = require('joi');
const bcrypt = require("bcryptjs");

const schema = mongoose.Schema;

let options = Joi.object({
    user_name: Joi.string().trim().min(3).max(30).required(),
    name: Joi.string().trim().min(1).max(30).required(),
    role: Joi.string().default('user').valid('admin', 'staff', 'user').required(),
    password: Joi.string().trim().min(8).required(),
    created_at: Joi.date().default(Date.now()).required(),
    update_at: Joi.date().default(Date.now()).required()
});


//create Schema
const userSchema = new schema(Joigoose.convert(options));
userSchema.obj.user_name.unique = true;
module.exports = User = mongoose.model('User', userSchema);


module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
};


module.exports.getUserByUsername = function(user_name, callback){
    const query = {user_name: user_name};
    User.findOne(query, callback);
};



module.exports.addUser = function(newUser, callback){
bcrypt.genSalt(10, (err, salt)=>{
    bcrypt.hash(newUser.password, salt, (err, hash) =>{
        if(err) throw err;
        newUser.password = hash;
        newUser.save(callback);
    });
});
};

module.exports.camparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, (err, isMatch)=>{
        if(err) throw err;
        callback(null, isMatch);
    })};


module.exports.updateInfo = function(user, callback){
    const query = {"isEmailValid": true }
    const options = { upsert: true, new: true }
    User.findByIdAndUpdate(user.id, query, callback);
}
