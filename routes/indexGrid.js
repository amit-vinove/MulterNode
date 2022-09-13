var express = require("express");
var multer = require("multer");
var path = require("path");
var jwt = require("jsonwebtoken");
var empModel = require("../modules/employee");
const { readdir } = require("node:fs/promises");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
var router = express.Router();
var employee = empModel.find({});
var imgName="";
var flag;

const mongoURI = "mongodb://localhost:27017/employee";
const conn = mongoose.createConnection(mongoURI);
let gfs;
conn.once("open", () => {gfs = Grid(conn.db, mongoose.mongo); gfs.collection("employee")});

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
  }
})

var upload = multer({
  fileFilter: async function (req, file, cb) {
    cons
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

  if (req.fileValidationError) {
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
