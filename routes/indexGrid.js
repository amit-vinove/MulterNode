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
    console.log(file.originalname+"_"+store.get("loggeduser"));
    imgName = file.originalname+"_"+store.get("loggeduser");
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

router.get("/home", function (req, res, next) {
  var employee = empModel.find({username:store.get("loggeduser")});
  employee.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      error: "",
      success: "",
      loggeduser: store.get("loggeduser"),
    });
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

router.post("/home", upload, async function (req, res, next) {
  if (req.fileValidationError) {
    var employee = empModel.find({username:store.get("loggeduser")});
    employee.exec(function (err, data) {
      if (err) throw err;
      res.render("index", {
        title: "Image Records",
        records: data,
        error: "Image Already Exist",
        success: "",
        loggeduser: store.get("loggeduser"),
      });
    });
  } else {
    var empDetails = new empModel({
      name: req.body.uname,
      email: req.body.email,
      image: imgName,
      username:store.get("loggeduser"),
    });
    empDetails.save(function (err, req1) {
      if (err) throw err;
      var employee = empModel.find({username:store.get("loggeduser")});
      employee.exec(function (err, data) {
        if (err) throw err;
        res.render("index", {
          title: "Image Records",
          records: data,
          success: "Image Uploaded Successfully",
          error: "",
          loggeduser: store.get("loggeduser"),
        });
      });
    });
  }
});

router.post("/search/", function (req, res, next) {
  var fltrName = req.body.fltrName;
  var fltrEmail = req.body.fltrEmail;
  var fltrImage = req.body.fltrImage;
  console.log(fltrName, fltrEmail, fltrImage);

  if (fltrName != "" && fltrEmail != "" && fltrImage != "") {
    var flterParameter = { name: fltrName, email: fltrEmail, image: fltrImage, username:store.get("loggeduser") };
  } 
  else if (fltrName != "" && fltrEmail == "" && fltrImage != "") {
    var flterParameter = { name: fltrName, image: fltrImage , username:store.get("loggeduser")};
  }
   else if (fltrName == "" && fltrEmail != "" && fltrImage != "") {
    var flterParameter = {email: fltrEmail, image: fltrImage , username:store.get("loggeduser")};
  } 
  else if (fltrName == "" && fltrEmail == "" && fltrImage != "") {
    var flterParameter = { image: fltrImage , username:store.get("loggeduser")};
  } 
  else if (fltrName != "" && fltrEmail == "" && fltrImage == "") {
    var flterParameter = { name: fltrName , username:store.get("loggeduser")};
  } 
  else if (fltrName == "" && fltrEmail != "" && fltrImage == "") {
    var flterParameter = { email: fltrEmail , username:store.get("loggeduser")};
  } 
  else {
    var flterParameter = {username:store.get("loggeduser")};
  }
  var employeeFilter = empModel.find(flterParameter);
  employeeFilter.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      success: "",
      error: "",
      loggeduser: store.get("loggeduser"),
    });
  });
});

router.post("/sort/", function (req, res, next) {
  var sortType = req.body.sortType;
  console.log(sortType);

  if (sortType == "name") {
    var sortParameter = { "name":1 };  
  } 
  else if (sortType == "email") {
    var sortParameter = { "email":1 };  
  }
  
  var employeeFilter = empModel.find({username:'Amitk123'}).sort(sortParameter);
  employeeFilter.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      success: "",
      error: "",
      loggeduser: store.get("loggeduser"),
    });
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
        res.redirect("/home");
    } else {
      res.send("Invalid Username or Password");
    }
  })
});

router.post("/signup", function (req, res, next) {

  var userDetails = new userModel({
  username : req.body.username,
  password : req.body.password,
  })
  userDetails.save(function (err, req1) {
    res.redirect("/");
  });
});

module.exports = router;
