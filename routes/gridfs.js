const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const app = express();
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
const mongoURI ="mailto:mongodb+srv://rahul123:rahul123@cluster0.w2iqn.mongodb.net/DocumentFiles";
const conn = mongoose.createConnection(mongoURI);
const port = 5000;
let gfs;
conn.once("open", () => { gfs = Grid(conn.db, mongoose.mongo);  gfs.collection("Office")});
conn.once("open", () => { gfs = Grid(conn.db, mongoose.mongo);  gfs.collection("Personal")});

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
                  bucketName: req.body.typeOfFile,
              };
              resolve(fileInfo);

          });
      });
  },
});

const upload = multer({

  fileFilter: async function  (req, file, cb) {
    console.log(file.originalname);
  
      gfs.files.find({ filename: file.originalname })
          .toArray((err, files) => {
            console.log(files ,"type",typeof files , files.length);
              if (files.length > 0) 
              {
                req.fileValidationError = `You cant upload the same file bro`;
                  cb(null, false, req.fileValidationError);
              }
               else               
                cb(null, true ,req.body.typeOfFile);
               })
      }, storage
});

app.post("/upload", upload.single("file"), (req, res) => {

  if (req.fileValidationError) {
      res.send(req.fileValidationError)
  }
  else
      res.send("File uploaded successfully");
});
app.listen(port, () => console.log(`Server started on port ${port}`));




