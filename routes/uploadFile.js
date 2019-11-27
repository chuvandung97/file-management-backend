var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');

router.post('/', Multer({dest: "./uploads/"}).single("file"), function(request, response) {
    console.log(request.file.originalname)
    console.log(request.file.path)
    var metaData = {
      'Content-Type': 'images/*',
    }
    minioClient.fPutObject("test2", request.file.originalname, request.file.path, metaData, function(error, etag) {
        if(error) {
            return console.log(error);
        }
        response.send(request.file);
        
    });
});

module.exports = router;