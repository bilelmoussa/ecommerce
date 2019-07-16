const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const bodyParser = require('body-parser');
const passport = require("passport");
const cors = require("cors");
const os = require('os');

let  address;
let ifaces = os.networkInterfaces();

// Iterate over interfaces ...
for (let dev in ifaces) {
    // ... and find the one that matches the criteria
    let iface = ifaces[dev].filter(function(details) {
        return details.family === 'IPv4' && details.internal === false;
    });
    if(iface.length > 0) address = iface[0].address;
}

//user api 
const user = require('./routes/api/users');

//Upload API
const Upload = require('./upload/upload');

//express app
const app = express();

//secure headers
app.use(helmet());

// for reversed proxy users
app.enable("trust proxy");

//limit the amount request api
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  });
app.use("/api/", apiLimiter);

// cross browser
let corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

//body-parser
app.use(bodyParser.json());

//config 
const config = require('./config/keys');

//db config 
const db = config.database;

//connect to database
mongoose.set('useFindAndModify', false);
mongoose
    .connect(db, {useNewUrlParser: true })
    .then(()=>{console.log('MongoDB Connected... ')})
    .catch(err=>{console.log('Error: ',  err)});


//passport auth
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

//Use Routes
app.use('/api/upload', Upload);
app.use('/api/user', user);

//Port 
const port = process.env.port || 5000;

app.get('/server', function(req, res) {
    res.json('Server Side Work Just Fine !');
});


app.listen(port, ()=>{console.log('\x1b[36m%s\x1b[0m', 'Server Started on:')
                      console.log('\x1b[36m%s\x1b[0m', `             Local: http://localhost:${port}`);
                      console.log('\x1b[36m%s\x1b[0m', `             External: http://${address}:${port}`);
              
                    });
