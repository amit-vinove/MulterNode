var express = require("express");
const mongoose = require("mongoose");
var multer = require("multer");
var path = require("path");
var jwt = require("jsonwebtoken");
var empModel = require("../modules/employee");
var userModel = require("../modules/user");
const { readdir } = require("node:fs/promises");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
var router = express.Router();
// var user = userModel.find({});
const crypto = require("crypto");
const store = require("store2");
var imgName = "";
var flag;

const mongoURI = "mongodb://localhost:27017/employee";
const conn = mongoose.createConnection(mongoURI);
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("employee");
});

router.use(express.static(__dirname + "./public/"));

const storage = new GridFsStorage({
  url: mongoURI,
  file: function (req, file) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const fileInfo = {
          filename: file.originalname+"_"+store.get("loggeduser"),
          bucketName: "employee",
        };
        resolve(fileInfo);
      });
    });
  },
});

var upload = multer({
  fileFilter: async function (req, file, cb) {
    imgName = file.originalname+"_"+req.body.loggeduser;
    gfs.files.find({ filename: imgName }).toArray((err, files) => {
      console.log(files, "type", typeof files, files.length);
      if (files.length > 0) {
        req.fileValidationError = `File Already Exists`;
        cb(null, false, req.fileValidationError);
      } else cb(null, true, req.body.typeOfFile);
    });
  },
  storage,
}).single("file");

router.get("/getData/:username", function (req, res, next) {
  var employee = empModel.find({username:req.params.username});
  employee.exec(function (err, data) {
    if (err) throw err;
    return res.send(data);
  });
});

router.get("/images/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image",
      });
    }
  });
});

router.post("/uploadImage", upload, async function (req, res, next) {
  if (req.fileValidationError) {
    return res.send("Image Already Exists");
  } else {
    var empDetails = new empModel({
      name: req.body.name,
      email: req.body.email,
      image: imgName,
      username:req.body.username,
    });
    empDetails.save(function (err, req1) {
      if (err) throw err;
      return res.send("Image Uploaded Successfully");
    });
  }
});

router.post("/search", function (req, res, next) {
  var fltrName = req.body.fltrName;
  var fltrEmail = req.body.fltrEmail;
  var fltrImage = req.body.fltrImage;
  var username = req.body.username;

  if (fltrName != "" && fltrEmail != "" && fltrImage != "") {
    var flterParameter = { name: fltrName, email: fltrEmail, image: fltrImage, username:username };
  } 
  else if (fltrName != "" && fltrEmail == "" && fltrImage != "") {
    var flterParameter = { name: fltrName, image: fltrImage , username:username};
  }
   else if (fltrName == "" && fltrEmail != "" && fltrImage != "") {
    var flterParameter = {email: fltrEmail, image: fltrImage , username:username};
  } 
  else if (fltrName == "" && fltrEmail == "" && fltrImage != "") {
    var flterParameter = { image: fltrImage+"_"+username , username:username};
  } 
  else if (fltrName != "" && fltrEmail == "" && fltrImage == "") {
    var flterParameter = { name: fltrName , username:username};
  } 
  else if (fltrName == "" && fltrEmail != "" && fltrImage == "") {
    var flterParameter = { email: fltrEmail , username:username};
    console.log(flterParameter);
  } 
  else {
    var flterParameter = {username:username};
  }
  var employeeFilter = empModel.find(flterParameter);
  employeeFilter.exec(function (err, data) {
    if (err) throw err;
    return res.send(data);
  });
});

router.post("/sort", function (req, res, next) {
  var sortType = req.body.sortType;
  var username = req.body.username;

  if (sortType == "name") {
    var sortParameter = { "name":1 };  
  } 
  else if (sortType == "email") {
    var sortParameter = { "email":1 };  
  }
  
  var employeeFilter = empModel.find({username:username}).sort(sortParameter);
  employeeFilter.exec(function (err, data) {
    if (err) throw err;
    return res.send(data);
  });
});


router.get("/", function (req, res, next) {
    store.clearAll();
    res.render("login");
});

router.post("/logout", function (req, res, next) {
  store.clearAll();
  res.redirect("/");
});

router.get("/signup", function (req, res, next) {
    res.render("signup");
});

router.post("/login", function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  var checkUser = userModel.findOne({ username: username });
  checkUser.exec((err, data) => {
    if (err) throw err;
    var getPassword = data.password;
    if (password == getPassword) {
        store.set('loggeduser',username);
        return res.send('Login Successfull');
    } else {
      return res.send("Invalid Username or Password");
    }
  })
});

router.post("/signup", function (req, res, next) {

  var userDetails = new userModel({
  username : req.body.username,
  password : req.body.password,
  })
  userDetails.save(function (err, req1) {
    return res.send('Signup Successfull');
  });
});

module.exports = router;
