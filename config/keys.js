require('dotenv').config();
let secret = process.env.SECRET || "SECRET";

module.exports = {
    database: "mongodb://localhost:27017/ecommerce",
    secret: secret,   
}