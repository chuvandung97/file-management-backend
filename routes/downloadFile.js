var express = require('express');
var router = express.Router();
var minioClient = require('../config/minio');

router.get("/download", function(request, response) {
    minioClient.presignedGetObject('000aab', request.body.name, 60, function(err, presignedUrl) {
      if (err) return console.log(err)
      response.status(200).json({url: presignedUrl})
    })
});