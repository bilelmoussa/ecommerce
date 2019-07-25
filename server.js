const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const bodyParser = require('body-parser');
const passport = require("passport");
const cors = require("cors");
const os = require('os');
const path = require('path');

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

//Product API
const Product = require('./routes/api/products');

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

//mongoURI config 
const db = config.database;


//connect to database
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
const conn = mongoose.createConnection(db);


// Init gfs
let gfs;

conn.once('open', ()=>{
     gfs = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: "uploads"});
})

mongoose.connect(db)
.then(()=>{console.log('MongoDB Connected... ')})
.catch(err=>{console.log('Error: ',  err)});



app.use(express.static(path.join(__dirname, 'client/build')));


//passport auth
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);



app.get('/files', (req, res) => {
    gfs.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
          res.status(400).json({ files: false });
        } else {
            res.status(200).json({ files: files });
        }
      });
});

app.get('/image/:filename', (req, res) => {
    gfs.find({}).filter({filename: req.params.filename}).toArray((err, files)=>{
        if(err){
            res.status(404).json({success: false, err: err})
        }
        if(!files){
            res.status(404).json({success: false, msg: "No File Found"})
        }

        const readstream = gfs.openDownloadStreamByName(files[0].filename);

        res.writeHead(200, {'Content-Type': files[0].contentType });     
        return readstream.pipe(res);
    })
});


//Use Routes
app.use('/api/user', user);
app.use('/api/product', Product);


app.get('*', (req, res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});
  

//Port 
const port = process.env.port || 5000;


app.listen(port, ()=>{console.log('\x1b[36m%s\x1b[0m', 'Server Started on:')
                      console.log('\x1b[36m%s\x1b[0m', `             Local: http://localhost:${port}`);
                      console.log('\x1b[36m%s\x1b[0m', `             External: http://${address}:${port}`);
              
                    });
