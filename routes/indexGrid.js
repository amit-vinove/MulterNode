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
var employee = empModel.find({});
// var user = userModel.find({});
const crypto = require("crypto");

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
          filename: file.originalname,
          bucketName: "employee",
        };
        resolve(fileInfo);
      });
    });
  },
});

var upload = multer({
  fileFilter: async function (req, file, cb) {
    console.log(file.originalname);
    imgName = file.originalname;
    gfs.files.find({ filename: file.originalname }).toArray((err, files) => {
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
  employee.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      error: "",
      success: "",
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
    employee.exec(function (err, data) {
      if (err) throw err;
      res.render("index", {
        title: "Image Records",
        records: data,
        error: "Image Already Exist",
        success: "",
      });
    });
  } else {
    var empDetails = new empModel({
      name: req.body.uname,
      email: req.body.email,
      image: imgName,
    });
    empDetails.save(function (err, req1) {
      if (err) throw err;
      employee.exec(function (err, data) {
        if (err) throw err;
        res.render("index", {
          title: "Image Records",
          records: data,
          success: "Image Uploaded Successfully",
          error: "",
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
    var flterParameter = { name: fltrName, email: fltrEmail, image: fltrImage };
  } 
  else if (fltrName != "" && fltrEmail == "" && fltrImage != "") {
    var flterParameter = { name: fltrName, image: fltrImage };
  }
   else if (fltrName == "" && fltrEmail != "" && fltrImage != "") {
    var flterParameter = {email: fltrEmail, image: fltrImage };
  } 
  else if (fltrName == "" && fltrEmail == "" && fltrImage != "") {
    var flterParameter = { image: fltrImage };
  } 
  else if (fltrName != "" && fltrEmail == "" && fltrImage == "") {
    var flterParameter = { name: fltrName };
  } 
  else if (fltrName == "" && fltrEmail != "" && fltrImage == "") {
    var flterParameter = { email: fltrEmail };
  } 
  else {
    var flterParameter = {};
  }
  var employeeFilter = empModel.find(flterParameter);
  employeeFilter.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      success: "",
      error: "",
    });
  });
});

router.get("/", function (req, res, next) {
    res.render("login");
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
