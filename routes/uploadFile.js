var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');

router.post("/upload", Multer({dest: "./uploads/"}).single("file"), function(request, response) {
    console.log(request.file.originalname)
    console.log(request.file.path)
    var metaData = {
      'Content-Type': 'images/png',
    }
    minioClient.fPutObject("000aab", request.file.originalname, request.file.path, metaData, function(error, etag) {
        if(error) {
            return console.log(error);
        }
        response.send(request.file);
    });
});