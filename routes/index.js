var express = require("express");
var multer = require("multer");
var path = require("path");
var jwt = require("jsonwebtoken");
var empModel = require("../modules/employee");
const { readdir } = require("node:fs/promises");

var router = express.Router();
var employee = empModel.find({});
var imgName="";
var flag;

router.use(express.static(__dirname + "./public/"));

var Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  fileFilter: async function (req, file, cb) {
    const files = await readdir("public/uploads");
    imgName = file.originalname
    if (files.includes(imgName)) {
      flag = false;
      req.fileValidationError = "already exit";
      return cb(null, false, req.fileValidationError);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const destination = "./public/uploads/";
      cb(null, destination);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
}).single("file");


router.get("/", function (req, res, next) {
  employee.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      error: "",
      success:""
    });
  });
});

router.post("/", upload, async function (req, res, next) {
  console.log(imgName)
  const files = await readdir("public/uploads");
  console.log(files)
  if (flag == false) {
    employee.exec(function (err, data) {
      if (err) throw err;
      res.render("index", {
        title: "Image Records",
        records: data,
        error: "Image Already Exist",
        success:""
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
          error:""
        });
      });
    });
  }
});

module.exports = router;
