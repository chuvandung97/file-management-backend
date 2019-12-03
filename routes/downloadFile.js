var express = require('express');
var router = express.Router();
var minioClient = require('../config/minio');

router.get('/', function(req, res) {
    minioClient.presignedGetObject(req.query.bucket_name, req.query.name, 60, function(err, presignedUrl) {
      if (err) return res.status(500).json({ code: 500, message: "Tải xuống thất bại !", body: {err} });
      res.status(200).json({ code: 200, message: "Tải xuống thành công !", body: {url: presignedUrl} })
    }) 
});

module.exports = router;